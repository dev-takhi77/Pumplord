import Token from '../models/token';
import Wallet from '../models/wallet';
import Vanity from '../models/vanity';
import { IBondingCurveData, IBuyData, ILaunchData, ISellData, IToken } from '../types/token';
import { config } from 'dotenv';
import _, { chunk } from 'lodash'
import { PumpFunSDK } from '../contract/pumpfun/pumpfun';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction } from '@solana/web3.js';
import { connection, jitoLocation } from '../config/constants';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { buildVersionedTx, getTokenBalance, sendTx } from '../utils/utils';
import vanity from '../models/vanity';
import { IWallet } from '../types/wallet';
import { jitoWithAxios } from '../utils/jito';

config();

const commitment = "confirmed";

let sdk = new PumpFunSDK(new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment }));

export class TokenService {
    public async create(tokenData: IToken): Promise<{ tokenTmp: IToken }> {
        const { address } = tokenData;

        // Create new user
        const newToken = new Token(tokenData);
        await newToken.save();

        vanity.findOneAndUpdate(
            { publicKey: address },
            {
                $set: {
                    used: true,
                }
            },
            { new: true }
        )

        return { tokenTmp: newToken };
    }

    public async launch(launchData: ILaunchData): Promise<{ success: boolean, tokenInfo?: IToken, error?: string }> {
        const { devWal, fundingWal, token, devBuyAmount } = launchData;

        const Ixs: TransactionInstruction[] = [];

        const tokenInfo = await Token.findOne({ address: token });
        if (!tokenInfo) {
            throw new Error("Wallet not found");
        }

        const wallet = await Wallet.findOne({ publickey: devWal });
        if (!wallet) {
            throw new Error("Wallet not found");
        }

        const creator = Keypair.fromSecretKey(bs58.decode(wallet.privatekey))

        const mintData = await Vanity.findOne({ publicKey: token });
        if (!mintData) {
            throw new Error("Doesn't exist token keypair!");
        }

        const mintKp: Keypair = Keypair.fromSecretKey(bs58.decode(mintData.privateKey));

        const createIx = await sdk.getCreateInstructions(creator.publicKey, tokenInfo.name, tokenInfo.symbol, tokenInfo.metadataUri, creator);
        Ixs.push(createIx);

        if (devBuyAmount > 0) {
            const buyIx = await this.makeBuyIx(creator, devBuyAmount, new PublicKey(token), 0);
            Ixs.push(buyIx[0]);
        }

        const result = await sendTx(connection, Ixs, creator.publicKey, [creator, mintKp])
        if (result.success) {
            const updateData = {
                owner: devWal,
                islaunch: true
            }

            const updatedToken = await Token.findOneAndUpdate(
                { address: launchData.token },
                { $set: updateData },
                { new: true }
            )

            if (!updatedToken) {
                throw new Error("Token not found");
            }

            await Vanity.findOneAndDelete(
                { publicKey: token }
            )

            return { success: true, tokenInfo: updatedToken.toObject() };
        } else {
            return { success: false, error: "Failed launch token!" }
        }
    }

    public async buy(buyData: IBuyData): Promise<{ success: boolean, error?: unknown }> {
        try {
            const { fundWal, user, buyAmount, token } = buyData;
            const buyers: IWallet[] = [];
            let ixs: TransactionInstruction[] = [];

            const wallets = await Wallet.find({ user, type: "buyer" })

            for (let i = 0; i < wallets.length; i++) {
                const tokenBal = await getTokenBalance(wallets[i].publickey, token)
                if (!tokenBal) {
                    buyers.push(wallets[i]);
                }
            }

            const buyer = buyers[Math.floor(Math.random() * buyers.length)]
            const buyerKp: Keypair = Keypair.fromSecretKey(bs58.decode(buyer.privatekey));

            const transferIx: TransactionInstruction = SystemProgram.transfer({
                fromPubkey: new PublicKey(fundWal),
                toPubkey: buyerKp.publicKey,
                lamports: (buyAmount + 0.05) * LAMPORTS_PER_SOL
            })

            const buyIx = await sdk.getBuyIxsBySolAmount(
                buyerKp.publicKey,
                new PublicKey(token),
                BigInt(buyAmount),
            );

            ixs = [transferIx, ...buyIx];

            const buyResults = await sendTx(
                connection,
                ixs,
                buyerKp.publicKey,
                [buyerKp],
                {
                    unitLimit: 200_000,
                    unitPrice: 50_000
                }
            );

            if (buyResults.success) {
                return { success: true };
            } else {
                return { success: false, error: buyResults.error }
            }
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getTokenList ~ error:", error)
            return { success: false, error };
        }
    }

    public async sell(sellData: ISellData): Promise<{ success: boolean, error?: unknown }> {
        try {
            const { percent, token, user } = sellData;

            const wallets = await Wallet.find({ user, type: "buyer" })
            const sellerKps: Keypair[] = [];
            const sellTx = new Transaction();
            // const sellIxs: TransactionInstruction[] = [];
            let cnt_versioned = 0;
            let cnt_jito = 0;
            const versionedSelltxs: VersionedTransaction[] = []

            // for (let i = 0; i < wallets.length; i++) {
            //     const tokenBal = await getTokenBalance(wallets[i].publickey, token);
            //     if (tokenBal) {
            //         const sellerKp: Keypair = Keypair.fromSecretKey(bs58.decode(wallets[i].privatekey));
            //         sellerKps.push(sellerKp);
            //         const sellAmout = Math.floor(tokenBal * percent * 0.01);
            //         const sellIx = await sdk.getSellInstructionsByTokenAmount(sellerKp.publicKey, new PublicKey(token), BigInt(sellAmout))
            //         sellIxs.push(sellIx);
            //     }
            // }

            try {
                for (let i = 0; i < wallets.length; i++) {
                    const tokenBal = await getTokenBalance(wallets[i].publickey, token)
                    if (tokenBal) {
                        cnt_versioned = cnt_versioned + 1;
                        const sellerKp: Keypair = Keypair.fromSecretKey(bs58.decode(wallets[i].privatekey));
                        sellerKps.push(sellerKp);
                        const sellAmout = Math.floor(tokenBal * percent * 0.01);
                        const sellIx = await sdk.getSellInstructionsByTokenAmount(sellerKp.publicKey, new PublicKey(token), BigInt(sellAmout))
                        sellTx.add(sellIx)
                        if (!(cnt_versioned % 4)) {
                            cnt_jito = cnt_jito + 1;
                            const versionedSellTx = await buildVersionedTx(connection, sellerKp.publicKey, sellTx);
                            versionedSellTx.sign([sellerKp, ...sellerKps.slice(cnt_versioned - 4, cnt_versioned)]);
                            versionedSelltxs.push(versionedSellTx);

                            sellTx.instructions = [];

                            if (!(cnt_jito % 4)) {
                                const res = await jitoWithAxios(versionedSelltxs, sellerKp, jitoLocation)
                                if (res) {
                                    for (let j = 0; j < 4; j++) {
                                        versionedSelltxs.pop();
                                    }
                                } else {
                                    console.log("Failed transaction!")
                                }
                            } else {
                                if (i === wallets.length - 1) {
                                    const res = await jitoWithAxios(versionedSelltxs, sellerKp, jitoLocation)
                                    if (res) {
                                        for (let j = 0; j < i; j++) {
                                            versionedSelltxs.pop();
                                        }
                                    } else {
                                        console.log("Failed transaction!")
                                    }
                                }
                            }
                        } else {
                            if (i === wallets.length - 1) {
                                // const sig = await sendAndConfirmTransaction(solanaConnection, sellTx, [feeWalletKp, sellWallets[0], sellWallets[1]])
                                // console.log("🚀 ~ customSell ~ sig:", sig)
                                const versionedSellTx = await buildVersionedTx(connection, sellerKp.publicKey, sellTx);
                                versionedSellTx.sign([sellerKp, ...sellerKps.slice(i + 1 - (cnt_versioned % 4), i + 1)]);
                                versionedSelltxs.push(versionedSellTx);
                                const res = await jitoWithAxios(versionedSelltxs, sellerKp, jitoLocation)
                                if (res) {
                                } else {
                                    console.log("Failed transaction!")
                                }
                            }
                        }
                    }
                }
                return { success: true }
            } catch (error) {
                return { success: false, error };
            }
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getTokenList ~ error:", error)
            return { success: false, error };
        }
    }

    public async getTokenList(user: string): Promise<{ success: boolean, tokenList?: string[], error?: unknown }> {
        try {
            const tokens = await Token.find({ user, islaunch: true });

            const tokenList = tokens.map((token: IToken) => {
                return token.address;
            })

            return { success: true, tokenList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getTokenList ~ error:", error)
            return { success: false, error };
        }
    }

    public async getTokenLaunchList(user: string): Promise<{ success: boolean, tokenList?: string[], error?: unknown }> {
        try {
            const tokens = await Token.find({ user, islaunch: false });

            const tokenList = tokens.map((token: IToken) => {
                return token.address;
            })

            return { success: true, tokenList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getTokenLaunchList ~ error:", error)
            return { success: false, error };
        }
    }

    /**
     * updateTokenInfo
     */
    public async updateTokenInfo() {
        const tokens = await Token.find().sort({ field: -1 });
        if (!tokens || tokens.length === 0) return false

        // Split tokenMintList into batches of 50
        const tokenBatches = chunk(tokens, 50)

        for (const batch of tokenBatches) {
            const tokenMintList: string[] = batch.map(
                (token: IToken) => token.address
            )

            // Fetch price data for current batch
            const updatedTokensInfo: any =
                await this.getTokensInfo(tokenMintList)
            if (!updatedTokensInfo) continue
        }

        console.log('History table updated successfully.')
    }

    public async getTokenInfo(mint: string): Promise<IToken> {
        const bondingCurveAcc: IBondingCurveData | null = await sdk.getBondingCurveAccount(new PublicKey(mint));
        const solreserves = Number(bondingCurveAcc?.realSolReserves);
        const price = Number(bondingCurveAcc?.virtualSolReserves) / Number(bondingCurveAcc?.virtualTokenReserves)
        const marketcap = price * Number(bondingCurveAcc?.tokenTotalSupply);
        const liquidity = solreserves * 2;

        const updateData = {
            solreserves,
            price,
            marketcap,
            liquidity
        }

        const tokenInfo = await Token.findOneAndUpdate(
            { address: mint },
            { $set: updateData },
            { new: true }
        ) as IToken

        return tokenInfo;
    }

    // make buy instructions
    private async makeBuyIx(kp: Keypair, buyAmount: number, mintAddress: PublicKey, index: number) {
        let buyIx = await sdk.getBuyInstructionsBySolAmount(
            kp.publicKey,
            mintAddress,
            BigInt(buyAmount),
            index
        );

        return buyIx
    }

    // get token infomation
    private async getTokensInfo(tokenList: string[]): Promise<IToken[]> {
        const tokensInfo: IToken[] = [];
        for (let i = 0; i < 50; i++) {
            const tokenInfo: IToken = await this.getTokenInfo(tokenList[i]);
            tokensInfo.push(tokenInfo);
        }

        return tokensInfo
    }
}