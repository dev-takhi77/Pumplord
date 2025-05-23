import { Keypair } from "@solana/web3.js";
import { Document } from "mongoose";

// Interface for the Wallet document
export interface IBot extends Document {
    name: string;
    speed_mode: number;
    bump_amount: number;
    burst: number;
    status: boolean;
    used: boolean;
    user: string;
}

export interface IDistWallet {
    privateKey: string;
    pubkey: string;
    amount: number;
    token_id: string
}

export interface IVolumeData {
    speed_mode: number;
    bump_amount: number;
    burst: number;
    token: string;
    status: boolean;
    user: string;
}