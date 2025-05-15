import Token from '../models/token';
import Wallet from '../models/wallet';
import Vanity from '../models/vanity';
import { ILaunchData, IToken } from '../types/token';
import { config } from 'dotenv';
import { PumpFunSDK } from '../contract/pumpfun/pumpfun';
import { AnchorProvider } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { connection } from '../config/constants';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { sendTx } from '../utils/utils';
import vanity from '../models/vanity';

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

        const createTx = new Transaction();

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
        createTx.add(createIx);

        if (devBuyAmount > 0) {
            const buyIx = await this.makeBuyIx(creator, devBuyAmount, new PublicKey(token), 0);
            createTx.add(buyIx[0]);
        }

        const result = await sendTx(connection, createTx, creator.publicKey, [creator, mintKp])
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
}