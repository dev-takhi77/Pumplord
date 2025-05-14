import Token from '../models/token';
import { ILaunchData, IToken } from '../types/token';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class TokenService {
    public async create(tokenData: IToken): Promise<{ tokenTmp: IToken }> {
        const { address } = tokenData;

        const existingToken = await Token.findOne({ address });
        if (existingToken) {
            throw new Error('Username already taken');
        }

        // Create new user
        const newToken = new Token(tokenData);
        await newToken.save();

        return { tokenTmp: newToken };
    }

    public async launch(launchData: ILaunchData): Promise<{ tokenInfo: IToken }> {
        let liquidity;
        let marketcap;
        let price;
        let buyvolume;
        let sellvolume;

        const updateData = {
            liquidity,
            marketcap,
            price,
            buyvolume,
            sellvolume,
            owner: launchData.devWal,
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

        return { tokenInfo: updatedToken.toObject() };
    }

    public async getTokenList(owner: string): Promise<{ success: boolean, tokenList?: string[], error?: unknown }> {
        try {
            const tokens = await Token.find({ owner, islaunch: true });

            const tokenList = tokens.map((token: IToken) => {
                return token.address;
            })

            return { success: true, tokenList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getTokenList ~ error:", error)
            return { success: false, error };
        }
    }

    public async getTokenLaunchList(owner: string): Promise<{ success: boolean, tokenList?: string[], error?: unknown }> {
        try {
            const tokens = await Token.find({ owner, islaunch: false });

            const tokenList = tokens.map((token: IToken) => {
                return token.address;
            })

            return { success: true, tokenList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getTokenLaunchList ~ error:", error)
            return { success: false, error };
        }
    }
}