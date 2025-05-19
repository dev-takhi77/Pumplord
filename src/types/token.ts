import { Document } from 'mongoose';

// Interface for the Token document
export interface IToken extends Document {
    name: string;
    address: string;
    symbol: string;
    avatar: string;
    description: string;
    metadataUri: string;
    user: string;
    owner?: string;
    decimal?: number;
    supply?: number;
    liquidity?: number;
    price?: number;
    marketcap?: number;
    solreserves?: number;
    twitter?: string;
    telegram?: string;
    website?: string;
    islaunch?: boolean;
}

export interface ILaunchData {
    token: string;
    fundingWal: string;
    devWal: string;
    devBuyAmount: number;
}

export interface IBuyData {
    fundWal: string;
    token: string;
    buyAmount: number;
    user: string
}

export interface ISellData {
    percent: number;
    token: string;
    user: string;
}

export interface IBondingCurveData {
    discriminator: bigint,
    virtualTokenReserves: bigint,
    virtualSolReserves: bigint,
    realTokenReserves: bigint,
    realSolReserves: bigint,
    tokenTotalSupply: bigint,
    complete: boolean
}