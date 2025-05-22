import { Keypair } from "@solana/web3.js";
import { Document } from "mongoose";

// Interface for the Wallet document
export interface IBot extends Document {
    name: string;
    status: boolean;
    user: string;
}

export interface IDistWallet {
    privateKey: string;
    pubkey: string;
    amount: number;
    token_id: string
}

export interface IVolumeData {
    mainKp: Keypair;
    baseMint: string;
    distSolAmount: number;
    id: string;
}