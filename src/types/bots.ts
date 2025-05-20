import { Keypair } from "@solana/web3.js";

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