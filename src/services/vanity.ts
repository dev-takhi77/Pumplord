import Vanity from '../models/vanity';
import { config } from 'dotenv';
import { EtaMap, IVanity, IVanityData, KeyGeneratorOptions, WorkerMessage } from '../types/vanity';
// import { createVanityAddressWorker, generateVanityAddress } from '../utils/utils';
import { Worker } from 'worker_threads';
import { generateVanityAddress } from '../utils/utils';

config();

export class VanityService {
    private isSearching: boolean = false;
    private attempts: number = 0;
    private startTime: number = 0;
    private initialETA: number = 0;
    private workers: Worker[] = [];
    private progressUpdateInterval?: NodeJS.Timeout;
    private numWorkers: number;
    private onFound: (data: { publicKey: string; privateKey: string }) => void;
    private onStatusUpdate?: (stats: { elapsed: number; attempts: number; speed: number; eta?: number }) => void;
    private onError: (error: Error) => void;

    constructor(options: KeyGeneratorOptions = {}) {
        this.numWorkers = options.numWorkers || 4;
        this.onFound = options.onFound || ((data) => {
            console.log('Found matching key:');
            console.log('Public Key:', data.publicKey);
            console.log('Private Key:', data.privateKey);
        });
        this.onStatusUpdate = options.onStatusUpdate;
        this.onError = options.onError || ((error) => {
            console.error('Error:', error.message);
        });
    }

    private calculateETA(totalChars: number, caseSensitive: boolean): number {
        const etaMap: EtaMap = caseSensitive ? {
            1: 0,
            2: 2,
            3: 60,
            4: 1920,
            5: 57600,
            6: 2304000
        } : {
            1: 0,
            2: 1,
            3: 8,
            4: 120,
            5: 1800,
            6: 36000
        };

        return etaMap[totalChars] || 0;
    }

    private updateStats() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const speed = this.attempts / Math.max(1, elapsed);

        if (this.onStatusUpdate) {
            const stats = {
                elapsed,
                attempts: this.attempts,
                speed: Math.floor(speed),
                eta: this.initialETA > 0 ? Math.max(0, this.initialETA - elapsed) : undefined
            };
            this.onStatusUpdate(stats);
        }
    }

    private handleFoundKey(data: { publicKey: string; privateKey: string }) {
        this.isSearching = false;
        clearInterval(this.progressUpdateInterval);
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.onFound(data);
    }

    private async startGeneration(prefixInput: string, suffixInput: string, caseSensitive: boolean): Promise<void> {
        if (this.isSearching) {
            throw new Error('Search already in progress!');
        }

        this.isSearching = true;
        this.attempts = 0;
        this.startTime = Date.now();

        const prefix = caseSensitive ? prefixInput : prefixInput.toLowerCase();
        const suffix = caseSensitive ? suffixInput : suffixInput.toLowerCase();

        if (!prefix && !suffix) {
            this.isSearching = false;
            throw new Error('Please enter at least a prefix or suffix!');
        }

        const validChars = /^[1-9A-HJ-NP-Za-km-z]*$/;
        if ((prefix && !validChars.test(prefix)) || (suffix && !validChars.test(suffix))) {
            this.isSearching = false;
            throw new Error('Invalid characters! Only Base58 allowed (0OIl are excluded)');
        }

        const totalChars = prefix.length + suffix.length;
        this.initialETA = this.calculateETA(totalChars, caseSensitive);

        if (this.onStatusUpdate) {
            this.onStatusUpdate({
                elapsed: 0,
                attempts: 0,
                speed: 0,
                eta: this.initialETA
            });
        }

        clearInterval(this.progressUpdateInterval);
        this.progressUpdateInterval = setInterval(() => this.updateStats(), 1000);

        try {
            const workerPromises = Array.from({ length: this.numWorkers }, () => {
                return new Promise<void>((resolve, reject) => {
                    const worker = new Worker(`
                            const { parentPort } = require('worker_threads');
                            const { Keypair } = require('@solana/web3.js');
                            const { bs58 } = require('@coral-xyz/anchor/dist/cjs/utils/bytes');
                            
                            parentPort.on('message', (data) => {
                                const { prefix, suffix, caseSensitive } = data;
                                const batchSize = 1000;
    
                                while (true) {
                                    const keys = Array.from({ length: batchSize }, () => Keypair.generate());
                                    for (const key of keys) {
                                        const pubKey = key.publicKey.toString();
                                        const pubKeyToCheck = caseSensitive ? pubKey : pubKey.toLowerCase();
    
                                        const matchPrefix = prefix ? pubKeyToCheck.startsWith(prefix) : true;
                                        const matchSuffix = suffix ? pubKeyToCheck.endsWith(suffix) : true;
    
                                        if (matchPrefix && matchSuffix) {
                                            parentPort.postMessage({
                                                status: 'found',
                                                publicKey: pubKey,
                                                privateKey: bs58.encode(key.secretKey)
                                            });
                                            return pubKey;
                                        }
                                    }
                                    parentPort.postMessage({ status: 'searching', count: batchSize });
                                }
                            });
                        `, { eval: true });

                    worker.on('message', (message: WorkerMessage) => {
                        if (message.status === 'found' && message.publicKey && message.privateKey) {
                            this.handleFoundKey({
                                publicKey: message.publicKey,
                                privateKey: message.privateKey
                            });
                            resolve();
                        } else if (message.status === 'searching' && message.count) {
                            this.attempts += message.count;
                        }
                    });

                    worker.on('error', (err) => {
                        this.isSearching = false;
                        reject(err);
                    });

                    worker.on('exit', (code) => {
                        if (code !== 0) {
                            this.isSearching = false;
                            reject(new Error(`Worker stopped with exit code ${code}`));
                        }
                    });

                    this.workers.push(worker);
                    worker.postMessage({ prefix, suffix, caseSensitive });
                });
            });

            await Promise.race(workerPromises);
        } catch (error) {
            this.stopGeneration();
            throw error;
        }
    }

    public stopGeneration(): void {
        if (!this.isSearching) {
            throw new Error('No search is in progress!');
        }

        this.isSearching = false;
        clearInterval(this.progressUpdateInterval);
        this.workers.forEach(w => w.terminate());
        this.workers = [];

        this.attempts = 0;
        if (this.onStatusUpdate) {
            this.onStatusUpdate({
                elapsed: Math.floor((Date.now() - this.startTime) / 1000),
                attempts: 0,
                speed: 0
            });
        }
    }

    public isRunning(): boolean {
        return this.isSearching;
    }

    public async create(vanityData: IVanityData): Promise<{ vanityAddr: string }> {
        const { prefix, suffix, user } = vanityData;

        const promises = Array(1).fill(0).map(
            () => generateVanityAddress(prefix, suffix, true)
        );

        // Get all successful results
        const mainKp = (await Promise.allSettled(promises))
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        // await this.startGeneration(prefix, suffix, true)
        console.log("🚀 ~ VanityService ~ create ~ mainKp:", mainKp)
        const saveData: Partial<IVanity> = {
            publicKey: mainKp[0].publicKey,
            privateKey: mainKp[0].privateKey,
            used: false,
            user
        } as IVanity;

        // Create new user
        const newVanity = new Vanity(saveData);
        await newVanity.save();

        console.log("🚀 ~ VanityService ~ create ~ newVanity:", newVanity)
        return { vanityAddr: newVanity.publicKey };
        // return { vanityAddr: "newVanity.publicKey" };
    }

    public async getVanityList(user: string): Promise<{ success: boolean, vanityList?: string[], error?: unknown }> {
        try {
            const vanitys: IVanity[] = await Vanity.find({ user, used: false });

            const vanityList = vanitys.map((token) => {
                return token.publicKey;
            })

            return { success: true, vanityList };
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getvanityList ~ error:", error)
            return { success: false, error };
        }
    }
}