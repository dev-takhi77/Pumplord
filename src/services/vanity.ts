import Vanity from '../models/vanity';
import { config } from 'dotenv';
import { IVanity, IVanityData } from '../types/vanity';

config();

export class VanityService {
    public async create(vanityData: IVanityData): Promise<{ vanityAddr: string }> {
        const { start, end, user } = vanityData;
        let address = "";


        const saveData: Partial<IVanity> = {
            address,
            user
        }

        // Create new user
        const newVanity = new Vanity(saveData);
        await newVanity.save();

        return { vanityAddr: newVanity.address };
    }

    public async getVanityList(user: string): Promise<{ success: boolean, vanityList?: string[], error?: unknown }> {
        try {
            const vanitys: IVanity[] = await Vanity.find({ user }).lean();

            const vanityList = vanitys.map((token) => {
                return token.address;
            })

            return { success: true, vanityList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getvanityList ~ error:", error)
            return { success: false, error };
        }
    }
}