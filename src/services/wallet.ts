import Wallet from '../models/wallet';
import { config } from 'dotenv';
import { IWallet } from '../types/wallet';

config();

export class WalletService {
    public async create(walletData: IWallet): Promise<{ walletPub: string }> {
        const { privatekey } = walletData;

        const existingWallet = await Wallet.findOne({ privatekey });
        if (existingWallet) {
            throw new Error('Username already taken');
        }

        // Create new user
        const newWallet = new Wallet(walletData);
        await newWallet.save();

        return { walletPub: newWallet.publickey };
    }

    public async getWalletList(user: string): Promise<{ success: boolean, walletList?: string[], error?: unknown }> {
        try {
            const wallets = await Wallet.find({ user });

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