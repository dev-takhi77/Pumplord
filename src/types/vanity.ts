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

export interface WorkerMessage {
    status: 'found' | 'searching';
    publicKey?: string;
    privateKey?: string;
    count?: number;
}

export interface EtaMap {
    [key: number]: number;
}

export interface KeyGeneratorOptions {
    numWorkers?: number;
    onFound?: (data: { publicKey: string; privateKey: string }) => void;
    onStatusUpdate?: (stats: { elapsed: number; attempts: number; speed: number; eta?: number }) => void;
    onError?: (error: Error) => void;
}