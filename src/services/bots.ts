import Bot from '../models/bot';
import Wallet from '../models/wallet';
import { config } from 'dotenv';
import { IBot } from '../types/bots';
import { ComputeBudgetProgram, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { IDistWallet, IVolumeData } from '../types/bots';
import { execute, sendTx, sleep, transferSOL } from '../utils/utils';
import { connection, jitoLocation, jitoMode } from '../config/constants';
import { createCloseAccountInstruction, getAssociatedTokenAddress, getAssociatedTokenAddressSync } from '@solana/spl-token';
import Distribute from '../models/distribute';
import { jitoWithAxios } from '../utils/jito';
import { getBuyTxWithJupiter, getSellTxWithJupiter } from '../utils/botSwapAmm';
import { TokenService } from './token';

config();

export class BotsService {
    private tokenService: TokenService;
    private distritbutionNum: number = 3
    private slippage: number = 5
    private distIntervalMax: number = 50
    private distIntervalMin: number = 30
    private distSolAmount: number = 0.1
    private stop: boolean = false;

    constructor() {
        this.tokenService = new TokenService()
    }

    public async startVolumeBot(botsData: IVolumeData) {
        const { user, token, bump_amount, burst, speed_mode } = botsData;

        const bot = await Bot.findOne({ user })
        const bot_used = bot?.used;

        const wallet = await Wallet.findOne({ user, type: "fund" })
        const mainKp: Keypair = Keypair.fromSecretKey(bs58.decode(wallet?.privatekey!));

        const tokenInfo = await this.tokenService.getTokenInfo(token);
        const id = tokenInfo._id as string


        const solBalance = await connection.getBalance(mainKp.publicKey)
        console.log(`Volume bot is running`)
        console.log(`Wallet address: ${mainKp.publicKey.toBase58()}`)
        console.log(`Pool token mint: ${token}`)
        console.log(`Wallet SOL balance: ${(solBalance / LAMPORTS_PER_SOL).toFixed(3)}SOL`)
        console.log(`Distribute SOL to ${this.distritbutionNum} wallets`)

        if (solBalance < this.distSolAmount * LAMPORTS_PER_SOL) {
            console.log("Sol balance is not enough for distribution")
        }

        // main part
        for (; ;) {
            try {
                console.log("---- New round of distribution ---- \n")

                let data: {
                    kp: Keypair;
                    buyAmount: number;
                }[] | null = null

                console.log("Distribution wallet num: ", this.distritbutionNum)
                data = await this.distributeSol(mainKp, this.distritbutionNum, this.distSolAmount, id)
                if (data == null || data.length == 0) {
                    console.log("Distribution failed")
                    continue
                }

                data.map(async ({ kp }) => {
                    await sleep(speed_mode * 1000)
                    let srcKp = kp
                    // buy part with random percent
                    const solBalance = await connection.getBalance(srcKp.publicKey)

                    let buyAmountInPercent = Number((Math.random() * bump_amount).toFixed(3))

                    if (solBalance < 8 * 10 ** 6) {
                        console.log("Sol balance is not enough in one of wallets")
                        return
                    }

                    let buyAmountFirst = Math.floor((solBalance - 8 * 10 ** 6) / 100 * buyAmountInPercent)
                    let buyAmountSecond = Math.floor(solBalance - buyAmountFirst - 8 * 10 ** 6)

                    console.log(`balance: ${solBalance / 10 ** 9} first: ${buyAmountFirst / 10 ** 9} second: ${buyAmountSecond / 10 ** 9}`)
                    // try buying until success
                    let i = 0
                    while (true) {
                        try {
                            if (i > 10) {
                                console.log("Error in buy transaction")
                                return
                            }
                            const result = await this.buy(srcKp, new PublicKey(token), buyAmountFirst)
                            if (result) {
                                break
                            } else {
                                i++
                                // await sleep(2000)
                            }
                        } catch (error) {
                            i++
                        }
                    }

                    await sleep(speed_mode * 1000)

                    let l = 0
                    while (true) {
                        try {
                            if (l > 10) {
                                console.log("Error in buy transaction")
                                throw new Error("Error in buy transaction")
                            }
                            const result = await this.buy(srcKp, new PublicKey(token), buyAmountSecond)
                            if (result) {
                                break
                            } else {
                                l++
                                // await sleep(2000)
                            }
                        } catch (error) {
                            l++
                        }
                    }

                    await sleep(speed_mode * 1000)

                    // try selling until success
                    let j = 0
                    while (true) {
                        if (j > 10) {
                            console.log("Error in sell transaction")
                            return
                        }
                        const result = await this.sell(new PublicKey(token), srcKp, id)
                        if (result) {
                            break
                        } else {
                            j++
                            // await sleep(2000)
                        }
                    }

                    // SOL transfer part
                    const balance = await connection.getBalance(srcKp.publicKey)

                    let k = 0
                    while (true) {
                        try {
                            if (k > 3) {
                                console.log("Failed to transfer SOL to new wallet in one of sub wallet")
                                return
                            }
                            const baseAta = getAssociatedTokenAddressSync(new PublicKey(token), srcKp.publicKey)
                            const tx = new Transaction().add(
                                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200_000 }),
                                ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }),
                                createCloseAccountInstruction(
                                    baseAta,
                                    mainKp.publicKey,
                                    srcKp.publicKey
                                ),
                                SystemProgram.transfer({
                                    fromPubkey: srcKp.publicKey,
                                    toPubkey: mainKp.publicKey,
                                    lamports: balance
                                })
                            )

                            tx.feePayer = mainKp.publicKey
                            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

                            const sig = await sendAndConfirmTransaction(connection, tx, [srcKp, mainKp], { skipPreflight: true, commitment: "confirmed" })
                            console.log(`Gathered SOL back to main wallet, https://solscan.io/tx/${sig}`)

                            // filter the keypair that is completed (after this procedure, only keypairs with sol or ata will be saved in data.json)
                            // const walletsData = readJson()
                            // const wallets = walletsData.filter(({ privateKey }) => bs58.encode(srcKp.secretKey) != privateKey)
                            // saveNewFile(wallets)
                            break
                        } catch (error) {
                            console.log("Error in gather ")
                            k++
                        }
                    }
                })

            } catch (error) {
                console.log("Error in one of the steps")
            }
        }
    }

    private async distributeSol(mainKp: Keypair, distritbutionNum: number, distSolAmount: number, id: string) {
        const wallets = []
        /* Sending Sol to sub wallets */
        try {
            const sendSolIx: TransactionInstruction[] = []
            const mainSolBal = await connection.getBalance(mainKp.publicKey)
            if (mainSolBal <= 8 * 10 ** 6 * this.distritbutionNum) {
                console.log("Main wallet balance is not enough")
                return []
            }

            let solAmount = Math.floor(distSolAmount * 10 ** 9 / distritbutionNum)

            for (let i = 0; i < distritbutionNum; i++) {
                const wallet = Keypair.generate()
                let lamports = Math.floor(solAmount * (1 - (Math.random() * 0.2)))

                const distWalData = {
                    privateKey: bs58.encode(wallet.secretKey),
                    pubkey: wallet.publicKey.toBase58(),
                    amount: solAmount,
                    token_id: id
                }

                const newDistWall = new Distribute(distWalData);
                await newDistWall.save();

                wallets.push({ kp: wallet, buyAmount: solAmount })
                sendSolIx.push(
                    SystemProgram.transfer({
                        fromPubkey: mainKp.publicKey,
                        toPubkey: wallet.publicKey,
                        lamports
                    })
                )
            }

            try {
                const siTx = new Transaction().add(...sendSolIx)
                const latestBlockhash = await connection.getLatestBlockhash()
                siTx.feePayer = mainKp.publicKey
                siTx.recentBlockhash = latestBlockhash.blockhash
                const messageV0 = new TransactionMessage({
                    payerKey: mainKp.publicKey,
                    recentBlockhash: latestBlockhash.blockhash,
                    instructions: sendSolIx,
                }).compileToV0Message()
                const transaction = new VersionedTransaction(messageV0)
                transaction.sign([mainKp])
                let txSig
                if (jitoMode) {
                    txSig = await jitoWithAxios([transaction], mainKp, jitoLocation)
                    // txSig = await executeJitoTx([transaction], mainKp, jitoCommitment)
                } else {
                    txSig = await sendTx(
                        connection,
                        sendSolIx,
                        mainKp.publicKey,
                        [mainKp],
                        {
                            unitLimit: 200_000,
                            unitPrice: 50_000
                        }
                    )
                }
                if (txSig) {
                    const distibuteTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
                    console.log("SOL distributed ", distibuteTx)
                }
            } catch (error) {
                console.log("Distribution error")
                return null
            }

            console.log("Success in distribution")
            return wallets
        } catch (error) {
            console.log(`Failed to transfer SOL`)
            return null
        }
    }

    private async buy(newWallet: Keypair, baseMint: PublicKey, buyAmount: number) {
        let solBalance: number = 0
        try {
            solBalance = await connection.getBalance(newWallet.publicKey)
        } catch (error) {
            console.log("Error getting balance of wallet")
            return null
        }
        if (solBalance == 0) {
            return null
        }
        try {
            let buyTx = await getBuyTxWithJupiter(newWallet, baseMint, buyAmount, this.slippage)
            if (buyTx == null) {
                console.log(`Error getting buy transaction`)
                return null
            }
            const latestBlockhash = await connection.getLatestBlockhash()
            const txSig = await execute(buyTx, latestBlockhash, 1)
            if (txSig) {
                const tokenBuyTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
                console.log("Success in buy transaction: ", tokenBuyTx)
                return tokenBuyTx
            } else {
                return null
            }
        } catch (error) {
            console.log("Buy transaction error")
            return null
        }
    }

    private async sell(baseMint: PublicKey, wallet: Keypair, id: string) {
        try {
            const data: IDistWallet[] = await Distribute.find({ token_id: id })
            if (data.length == 0) {
                await sleep(1000)
                return null
            }

            const tokenAta = await getAssociatedTokenAddress(baseMint, wallet.publicKey)
            const tokenBalInfo = await connection.getTokenAccountBalance(tokenAta)
            if (!tokenBalInfo) {
                console.log("Balance incorrect")
                return null
            }
            const tokenBalance = tokenBalInfo.value.amount

            try {
                let sellTx = await getSellTxWithJupiter(wallet, baseMint, tokenBalance, this.slippage)
                if (sellTx == null) {
                    console.log(`Error getting buy transaction`)
                    return null
                }
                const latestBlockhash = await connection.getLatestBlockhash()
                const txSig = await execute(sellTx, latestBlockhash, false)
                if (txSig) {
                    const tokenSellTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
                    console.log("Success in sell transaction: ", tokenSellTx)
                    return tokenSellTx
                } else {
                    return null
                }
            } catch (error) {
                console.log("Sell transaction error")
                return null
            }
        } catch (error) {
            return null
        }
    }

    public async stopVolumeBot(user: string): Promise<IBot> {
        this.stop = true;

        const botStatus = await Bot.findOneAndUpdate(
            { user },
            { $set: { status: true } },
            { new: true }
        )

        return botStatus as IBot
    }

    public async chargeSol(user: string, amount: number): Promise<boolean> {
        try {
            const fundWal = await Wallet.findOne({ user, type: "fund" });
            const fundKp = Keypair.fromSecretKey(bs58.decode(fundWal?.privatekey!));

            const wallets = await Wallet.find({ user, type: "volume" });
            for (let i = 0; i < wallets.length; i++) {
                const fromKp = Keypair.fromSecretKey(bs58.decode(wallets[i].privatekey));

                await transferSOL(fundKp, fromKp.publicKey, fundKp, amount);
            }
            return true;
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getWalletList ~ error:", error)
            return false;
        }
    }
}
