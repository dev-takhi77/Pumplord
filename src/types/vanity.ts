import { Document } from 'mongoose';

// Interface for the vanity document
export interface IVanity extends Document {
    publicKey: string;
    privateKey: string;
    used: boolean;
    user: string;
}

export interface IVanityData {
    prefix: string;
    suffix: string;
    user: string;
}