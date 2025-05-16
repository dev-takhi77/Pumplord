import { Commitment, Connection, Finality, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction, VersionedTransactionResponse } from "@solana/web3.js";
import { connection, jitoFee } from "../config/constants";
import axios, { AxiosError } from "axios";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

export const jitoWithAxios = async (transaction: VersionedTransaction[], payer: Keypair, location: string) => {

    console.log('Starting Jito transaction execution...');
    const tipAccounts = [
        'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
        'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
        '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
        'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
        'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
        'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
        'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    ];
    const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])

    console.log(`Selected Jito fee wallet: ${jitoFeeWallet.toBase58()}`);

    try {
        console.log(`Calculated fee: ${jitoFee / LAMPORTS_PER_SOL} sol`);
        const latestBlockhash = await connection.getLatestBlockhash();
        const jitTipTxFeeMessage = new TransactionMessage({
            payerKey: payer.publicKey,
            recentBlockhash: latestBlockhash.blockhash,
            instructions: [
                SystemProgram.transfer({
                    fromPubkey: payer.publicKey,
                    toPubkey: jitoFeeWallet,
                    lamports: jitoFee,
                }),
            ],
        }).compileToV0Message();

        const jitoFeeTx = new VersionedTransaction(jitTipTxFeeMessage);
        jitoFeeTx.sign([payer]);

        for (let i = 0; i < transaction.length; i++) {
            console.log(await connection.simulateTransaction(transaction[i], { sigVerify: true }))
            const simulation = await connection.simulateTransaction(transaction[i], { sigVerify: true })
            if (simulation.value.err) {
                console.error("Transaction simulation error:", simulation.value.err)
                throw new Error("Transaction simulation failed")
            }
        }

        const jitoTxsignature = bs58.encode(jitoFeeTx.signatures[0]);

        // Serialize the transactions once here
        const serializedjitoFeeTx = bs58.encode(jitoFeeTx.serialize());
        const serializedTransactions = [serializedjitoFeeTx];
        for (let i = 0; i < transaction.length; i++) {
            const serializedTransaction = bs58.encode(transaction[i].serialize());
            serializedTransactions.push(serializedTransaction);
        }

        const endpoints = {
            mainnet: 'https://mainnet.block-engine.jito.wtf/api/v1/bundles',
            amsterdam: 'https://amsterdam.mainnet.block-engine.jito.wtf/api/v1/bundles',
            frankfurt: 'https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/bundles',
            ny: 'https://ny.mainnet.block-engine.jito.wtf/api/v1/bundles',
            tokyo: 'https://tokyo.mainnet.block-engine.jito.wtf/api/v1/bundles',
        }

        const endpoint = endpoints[location as keyof typeof endpoints];
        if (!endpoint) {
            console.error("Invalid location or endpoint:", location);
            return;
        }

        const requests = axios.post(endpoint, {
            jsonrpc: '2.0',
            id: 1,
            method: 'sendBundle',
            params: [serializedTransactions],
        })
        console.log('Sending transactions to endpoints...');

        const results = await requests.catch((e) => {
            console.error("Error response from Jito API:", e.response?.data || e.message);
            return e;
        });

        // Check if the response is successful
        if (results && results.status === 200 && results.data) {
            console.log(`Successful response`);
            console.log(`Confirming jito transaction...`);

            const txResult = await getTxDetails(connection, jitoTxsignature, "confirmed", "confirmed");
            console.log("🚀 ~ jitoCreatTansaction ~ txResult:", txResult);
            if (txResult && !txResult.meta?.err) {
                console.log("create token => ", `https://solscan.io/tx/${jitoTxsignature}`);
                return true;
            }
        } else {
            console.log(`No successful responses received for jito`);
            return false;
        }
    } catch (error) {
        if (error instanceof AxiosError) {
            console.log('Failed to execute jito transaction');
            return false
        }
        console.log('Error during transaction execution', error);
        return false
    }
}


const getTxDetails = async (
    connection: Connection,
    sig: string,
    commitment: Commitment,
    finality: Finality
): Promise<VersionedTransactionResponse | null> => {
    const latestBlockHash = await connection.getLatestBlockhash();
    const start_time = Date.now();
    await connection.confirmTransaction(
        {
            blockhash: latestBlockHash.blockhash,
            lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
            signature: sig,
        },
        commitment
    );
    console.log("during confirmTransaction time => ", Date.now() - start_time)

    return connection.getTransaction(sig, {
        maxSupportedTransactionVersion: 0,
        commitment: finality,
    });
};