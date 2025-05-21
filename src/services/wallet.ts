import Wallet from '../models/wallet';
import { config } from 'dotenv';
import { IWallet, IWalletData } from '../types/wallet';
import { Keypair } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

config();

export class WalletService {
    public async create(walletData: IWalletData): Promise<{ walletPub: string }> {
        const { type, user } = walletData;

        const walletKp = Keypair.generate();

        const saveWalletData: Partial<IWallet> = {
            privatekey: bs58.encode(walletKp.secretKey),
            publickey: walletKp.publicKey.toBase58(),
            type,
            user
        }

        // Create new user
        const newWallet = new Wallet(saveWalletData);
        await newWallet.save();

        return { walletPub: newWallet.publickey };
    }

    public async getWalletList(user: string, type: string): Promise<{ success: boolean, walletList?: string[], error?: unknown }> {
        try {
            const wallets = await Wallet.find({ user, type });

            const walletList = wallets.map((token: IWallet) => {
                return token.publickey;
            })

            return { success: true, walletList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getWalletList ~ error:", error)
            return { success: false, error };
        }
    }
}
