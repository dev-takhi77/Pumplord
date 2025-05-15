import { Document } from 'mongoose';

// Interface for the Wallet document
export interface IWallet extends Document {
    privatekey: string;
    publickey: string;
    type: "dev" | "fund" | "buyer" | "volume";
    user: string;
}

export interface IWalletData {
    type: "dev" | "fund" | "buyer" | "volume";
    user: string;
}