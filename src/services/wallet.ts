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
import { transferSOL } from '../utils/utils';

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

    public async redeemSol(user: string) {
        try {
            const fundWal = await Wallet.findOne({ user, type: "fund" });
            const fundKp = Keypair.fromSecretKey(bs58.decode(fundWal?.privatekey!));

            const wallets = await Wallet.find({ user });
            for (let i = 0; i < wallets.length; i++) {
                if (wallets[i].type !== "fund") {
                    const fromKp = Keypair.fromSecretKey(bs58.decode(wallets[i].privatekey));

                    const solBal = await connection.getBalance(fromKp.publicKey)
                    if (solBal) {
                        await transferSOL(fromKp, fundKp.publicKey, fundKp, solBal);
                    }
                }
            }
            return true;
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getWalletList ~ error:", error)
            return false;
        }
    }


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
                        if (walRes.type === "dev")
                            type = "dev"
                        else if (walRes.type === "buyer" || walRes.type === "volume" || walRes.type === "fund")
                            type = "project wallet"
                    } else {
                        type = "buyer"
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
