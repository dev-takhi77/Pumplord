import Vanity from '../models/vanity';
import { config } from 'dotenv';
import { IVanity, IVanityData } from '../types/vanity';
import { generateVanityAddress } from '../utils/utils';
import { Keypair } from '@solana/web3.js';
import pLocate from 'p-locate';

config();

export class VanityService {
    public async create(vanityData: IVanityData): Promise<{ vanityAddr: string }> {
        const { prefix, suffix, user } = vanityData;

        // Usage
        const mintKp = await pLocate(
            Array(20).fill(0).map(() => generateVanityAddress(prefix, suffix, true)),
            (result) => !!result, // Keep trying until a truthy value is found
            { preserveOrder: false } // Return the first success, not first in order
        );

        console.log("🚀 ~ VanityService ~ create ~ mintKp:", mintKp)
        // const vanityAddr1 = await generateVanityAddress(start, end, true);
        // const vanityAddr2 = await createVanityAddressWorker(start, end, true, () => { })
        // console.log("🚀 ~ VanityService ~ create ~ vanityAddr2:", vanityAddr2)

        const saveData: Partial<IVanity> = {
            publicKey: mintKp!.publicKey,
            privateKey: mintKp!.privateKey,
            used: false,
            user
        } as IVanity;

        // Create new user
        const newVanity = new Vanity(saveData);
        await newVanity.save();

        return { vanityAddr: newVanity.publicKey };
    }

    public async getVanityList(user: string): Promise<{ success: boolean, vanityList?: string[], error?: unknown }> {
        try {
            const vanitys: IVanity[] = await Vanity.find({ user, used: false });

            const vanityList = vanitys.map((token) => {
                return token.publicKey;
            })

            return { success: true, vanityList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getvanityList ~ error:", error)
            return { success: false, error };
        }
    }

    private async getFirstSuccess<T>(promises: Promise<T>[]): Promise<T> {
        let rejectionCount = 0;
        return new Promise((resolve, reject) => {
            promises.forEach(promise => {
                promise
                    .then(resolve) // Resolve immediately on first success
                    .catch(() => {
                        rejectionCount++;
                        if (rejectionCount === promises.length) {
                            reject(new Error("All promises rejected"));
                        }
                    });
            });
        });
    }
}