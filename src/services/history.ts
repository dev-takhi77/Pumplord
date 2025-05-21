import History from '../models/history';
import { config } from 'dotenv';
import { IHistory, IHistoryData } from '../types/history';
import { Keypair } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';

config();

export class WalletService {
    public async saveHisotry(historyData: IHistoryData): Promise<{ walletPub: string }> {
        const { user_id, token } = historyData;

        const walletKp = Keypair.generate();

        const saveWalletData: Partial<IHistory> = {
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
