import { Document } from 'mongoose';

// Interface for the vanity document
export interface IVanity extends Document {
    address: string;
    user: string;
}

export interface IVanityData {
    start: string;
    end: string;
    user: string;
}