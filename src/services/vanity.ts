import Vanity from '../models/vanity';
import { config } from 'dotenv';
import { IVanity, IVanityData } from '../types/vanity';
import { generateVanityAddress } from '../utils/utils';

config();

export class VanityService {
    public async create(vanityData: IVanityData): Promise<{ vanityAddr: string }> {
        const { prefix, suffix, user } = vanityData;

        const promises = Array(1).fill(0).map(
            () => generateVanityAddress(prefix, suffix, true)
        );

        // Get all successful results
        const mainKp = (await Promise.allSettled(promises))
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

        const saveData: Partial<IVanity> = {
            publicKey: mainKp[0].publicKey,
            privateKey: mainKp[0].privateKey,
            used: false,
            user
        } as IVanity;

        // Create new user
        const newVanity = new Vanity(saveData);
        await newVanity.save();

        console.log("🚀 ~ VanityService ~ create ~ newVanity:", newVanity)
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
}