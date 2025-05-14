import { Document } from 'mongoose';

// Interface for the Token document
export interface IToken extends Document {
    name: string;
    address: string;
    symbol: string;
    avatar: string;
    decription: string;
    decimal?: number;
    supply?: number;
    liquidity?: number;
    marketcap?: number;
    price?: number;
    buyvolume?: number;
    sellvolume?: number;
    owner?: string;
    socials?: {
        twitter?: string;
        telegram?: string;
        website?: string;
    };
    islaunch?: boolean;
}

export interface ILaunchData {
    token: string;
    fundingWal: string;
    devWal: string;
    devBuyAmount?: number;
}