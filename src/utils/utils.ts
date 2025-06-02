import { Commitment, ComputeBudgetProgram, Connection, Finality, Keypair, LAMPORTS_PER_SOL, PublicKey, SendTransactionError, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction, VersionedTransactionResponse } from "@solana/web3.js";
import { PriorityFee, TransactionResult } from "../contract/pumpfun/types";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { getAccount, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { connection } from "../config/constants";

export const DEFAULT_COMMITMENT: Commitment = "finalized";
export const DEFAULT_FINALITY: Finality = "finalized";

interface Blockhash {
    blockhash: string;
    lastValidBlockHeight: number;
}

export const sleep = async (ms: number) => {
    await new Promise((resolve) => setTimeout(resolve, ms))
}

export const getTokenBalance = async (wallet: string, mint: string) => {
    try {
        const mintPub = new PublicKey(mint);
        const walletPub = new PublicKey(wallet);
        const ata = getAssociatedTokenAddressSync(mintPub, walletPub);
        const tokenAccount = await getAccount(connection, ata);
        const balance = Number(tokenAccount.amount) / 10 ** 6;
        return balance;
    } catch {
        return 0;
    }
}

export const calculateWithSlippageBuy = (
    amount: bigint,
    basisPoints: bigint
) => {
    return amount + (amount * basisPoints) / BigInt(1000);
};

export const calculateWithSlippageSell = (
    amount: bigint,
    basisPoints: bigint
) => {
    return amount - (amount * basisPoints) / BigInt(1000);
};

export async function sendTx(
    connection: Connection,
    ix: TransactionInstruction[],
    payer: PublicKey,
    signers: Keypair[],
    priorityFees?: PriorityFee,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
): Promise<TransactionResult> {

    let newTx = new Transaction();

    if (priorityFees) {
        const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
            units: priorityFees.unitLimit,
        });

        const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: priorityFees.unitPrice,
        });
        newTx.add(modifyComputeUnits);
        newTx.add(addPriorityFee);
    }
    newTx.add(...ix);
    let versionedTx = await buildVersionedTx(connection, payer, newTx, commitment);
    versionedTx.sign(signers);
    try {
        console.log((await connection.simulateTransaction(versionedTx, undefined)))

        const sig = await connection.sendTransaction(versionedTx, {
            skipPreflight: false,
        });
        console.log("Transaction signature: ", `https://solscan.io/tx/${sig}`);

        let txResult = await getTxDetails(connection, sig, commitment, finality);
        if (!txResult) {
            return {
                success: false,
                error: "Transaction failed",
            };
        }
        return {
            success: true,
            signature: sig,
            results: txResult,
        };
    } catch (e) {
        if (e instanceof SendTransactionError) {
            let ste = e as SendTransactionError;
        } else {
            console.error(e);
        }
        return {
            error: e,
            success: false,
        };
    }
}

export const buildVersionedTx = async (
    connection: Connection,
    payer: PublicKey,
    tx: Transaction,
    commitment: Commitment = DEFAULT_COMMITMENT
): Promise<VersionedTransaction> => {
    const blockHash = (await connection.getLatestBlockhash(commitment))
        .blockhash;

    let messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockHash,
        instructions: tx.instructions,
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
};

export const getTxDetails = async (
    connection: Connection,
    sig: string,
    commitment: Commitment = DEFAULT_COMMITMENT,
    finality: Finality = DEFAULT_FINALITY
): Promise<VersionedTransactionResponse | null> => {
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction(
        {
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: sig,
        },
        commitment
    );

    return connection.getTransaction(sig, {
        maxSupportedTransactionVersion: 0,
        commitment: finality,
    });
};

export function generateVanityAddress(
    startsWith: string = '',
    endsWith: string = '',
    caseSensitive: boolean = false
): { publicKey: string; privateKey: string } {
    const startPattern = caseSensitive ? startsWith : startsWith.toLowerCase();
    const endPattern = caseSensitive ? endsWith : endsWith.toLowerCase();

    let attempts = 0;
    const startTime = Date.now();

    while (true) {
        attempts++;
        const keypair = Keypair.generate();
        const publicKey = keypair.publicKey.toString();
        const compareKey = caseSensitive ? publicKey : publicKey.toLowerCase();
        console.log("🚀 ~ compareKey:", compareKey)

        const startMatch = !startPattern || compareKey.startsWith(startPattern);
        const endMatch = !endPattern || compareKey.endsWith(endPattern);

        if (startMatch && endMatch) {
            const endTime = Date.now();
            console.log(`Found after ${attempts} attempts in ${(endTime - startTime) / 1000} seconds`);
            return {
                publicKey,
                privateKey: bs58.encode(keypair.secretKey)
            };
        }

        // Prevent blocking the main thread (especially important in browser)
        if (attempts % 1000 === 0) {
            setTimeout(() => { }, 0);
        }
    }
}

// Web Worker version for non - blocking generation
export function createVanityAddressWorker(
    startsWith: string = '',
    endsWith: string = '',
    caseSensitive: boolean = false,
    onFound: (result: { publicKey: string; privateKey: string }) => void
): Worker {
    const workerCode = `
    self.onmessage = function(e) {
      const { startsWith, endsWith, caseSensitive } = e.data;
      const startPattern = caseSensitive ? startsWith : startsWith.toLowerCase();
      const endPattern = caseSensitive ? endsWith : endsWith.toLowerCase();
      
      let attempts = 0;
      
      while (true) {
        attempts++;
        const keypair = self.generateKeypair();
        const publicKey = keypair.publicKey.toString();
        const compareKey = caseSensitive ? publicKey : publicKey.toLowerCase();
        console.log("🚀 ~ compareKey:", compareKey)
        
        const startMatch = !startPattern || compareKey.startsWith(startPattern);
        const endMatch = !endPattern || compareKey.endsWith(endPattern);
        
        if (startMatch && endMatch) {
          self.postMessage({
            publicKey,
            secretKey: keypair.secretKey,
            attempts
          });
          break;
        }
        
        // Report progress every 10000 attempts
        if (attempts % 10000 === 0) {
          self.postMessage({ progress: attempts });
        }
      }
    };
    
    // Mock function - in a real worker, you'd need to include @solana/web3.js
    self.generateKeypair = function() {
      // This is a placeholder - in a real implementation, you'd need to:
      // 1. Either bundle @solana/web3.js in the worker
      // 2. Or implement keypair generation manually
      return { publicKey: { toString: () => Math.random().toString(36).substring(2) }, secretKey: new Uint8Array() };
    };
  `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));

    worker.addListener('message', (e) => {
        if (e.data.publicKey) {
            onFound({
                publicKey: e.data.publicKey,
                privateKey: bs58.encode(e.data.secretKey)
            });
        }
    });

    worker.postMessage({ startsWith, endsWith, caseSensitive });

    return worker;
}

export const execute = async (transaction: VersionedTransaction, latestBlockhash: Blockhash, isBuy: boolean | 1 = true) => {
    const signature = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true })
    const confirmation = await connection.confirmTransaction(
        {
            signature,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            blockhash: latestBlockhash.blockhash,
        }
    );

    if (confirmation.value.err) {
        console.log("Confirmation error")
        return ""
    } else {
        if (isBuy === 1) {
            return signature
        } else if (isBuy)
            console.log(`Success in Buy transaction: https://solscan.io/tx/${signature}`)
        else
            console.log(`Success in Sell transaction: https://solscan.io/tx/${signature}`)
    }
    return signature
}


// Sol transfer
export const transferSOL = async (
    fromKeypair: Keypair,
    toAddress: PublicKey,
    signer: Keypair,
    amountInSOL: number
) => {
    try {
        // 1. Convert SOL amount to lamports (1 SOL = 1,000,000,000 lamports)
        const lamports = amountInSOL * LAMPORTS_PER_SOL;

        // 2. Create transaction
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toAddress,
                lamports,
            })
        );
        transaction.feePayer = signer.publicKey;

        const signature = await connection.sendTransaction(transaction, [fromKeypair, signer]);
        await connection.confirmTransaction(signature, "confirmed");
        console.log("Transaction successful with signature:", `https://solscan.io/tx/${signature}`);
    } catch (error) {
        console.error('Transfer failed:', error);
        throw error;
    }
}