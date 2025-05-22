import Wallet from '../models/wallet';
import Token from '../models/token';
import { config } from 'dotenv';
import { IWallet, IWalletData } from '../types/wallet';
import { Keypair, PublicKey } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { connection } from '../config/constants';
import { sdk } from './token';
import { IHolderData } from '../controllers/socket/constant';

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

    // public async redeemSol(user: string) {
    //     try {
    //         const wallets = await Wallet.find({ user, "volume" });

    //         const walletList = wallets.map((token: IWallet) => {
    //             return token.publickey;
    //         })

    //         return { success: true, walletList };
    //     } catch (error) {
    //         console.log("🚀 ~ TokenService ~ getWalletList ~ error:", error)
    //         return { success: false, error };
    //     }
    // }


    /**
     * @param tokens
     * @returns
     */
    public async getTopHolders(token: string) {
        try {
            const bondingCurveAcc = await sdk.getBondingCurvePDA(new PublicKey(token))
            const bondingCurveAccData = await sdk.getBondingCurveAccount(new PublicKey(token))

            const totalSupply = Number(bondingCurveAccData?.tokenTotalSupply);

            const bondingCurveData: IHolderData = {
                account: bondingCurveAcc.toBase58(),
                type: "bonding_curve",
                tokenAmount: Number(bondingCurveAccData?.realTokenReserves),
                solPercentage: Number(bondingCurveAccData?.realTokenReserves) * 100 / totalSupply
            }
            // Get all token accounts for this mint
            const accounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
                filters: [
                    {
                        dataSize: 165, // Size of token account
                    },
                    {
                        memcmp: {
                            offset: 0, // Mint address offset
                            bytes: token,
                        },
                    },
                ],
            });

            // Get balances for all accounts
            const accountsWithBalances = await Promise.all(
                accounts.map(async (account: any) => {
                    let type: string = '';
                    const walRes = await Wallet.findOne({ publickey: account.pubKey.toBase58() });
                    if (walRes) {
                        type = "project wallet"
                    } else {
                        const tokenRes = await Token.findOne({ owner: account.pubKey.toBase58() });
                        if (tokenRes) {
                            type = "dev";
                        } else {
                            type = "buyer"
                        }
                    }
                    const accountInfo = await connection.getTokenAccountBalance(account.pubkey);
                    return {
                        account: account,
                        type: type,
                        tokenAmount: Number(accountInfo.value.amount),
                        solPercentage: Number(accountInfo.value.amount) * 100 / totalSupply
                    };
                })
            );

            // Sort by balance (descending) and take top 100
            const sorted = accountsWithBalances.sort((a: any, b: any) => b.balance - a.balance);
            return [bondingCurveData, ...sorted.slice(0, 100)];

        } catch (error) {
            console.error(`Error fetching holders for token ${token}:`, error);
            return [];
        }
    };
}
