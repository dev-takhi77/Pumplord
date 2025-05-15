import { Document } from 'mongoose';

// Interface for the Wallet document
export interface IWallet extends Document {
    privatekey: string;
    publickey: string;
    user: string;
}