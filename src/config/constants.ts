import dotenv from "dotenv";
import type cors from 'cors'
import { Connection, PublicKey } from "@solana/web3.js"

dotenv.config();

try {
    dotenv.config();
} catch (error) {
    console.error("Error loading environment variables:", error);
    process.exit(1);
}


export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

/**
 * Initialize Cors
 */
export const corsOptionsHttp: cors.CorsOptions = {
    // Restrict Allowed Origin
    origin: process.env.ALLOW_HOSTS,
    methods: 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}

export const corsOptionsSocket = process.env.SOCKET_ALLOW_HOSTS

export const API_PREFIX = process.env.API_PREFIX || '/api';
export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const MONGO_URL = process.env.MONGO_URL;

export const RPC_ENDPOINT = process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";
export const RPC_WEBSOCKET_ENDPOINT = process.env.RPC_WEBSOCKET_ENDPOINT || "wss://api.mainnet-beta.solana.com";
export const connection = new Connection(RPC_ENDPOINT, { wsEndpoint: RPC_WEBSOCKET_ENDPOINT });

export const jitoMode = Boolean(process.env.JITO_MODE);
export const jitoFee = Number(process.env.JITO_FEE) || 50000;
export const jitoLocation = process.env.JITO_LOCATION || 'ny';


const GlobalAccount = {
    initialized: true,
    discriminator: 9183522199395952807n,
    authority: new PublicKey("DCpJReAfonSrgohiQbTmKKbjbqVofspFRHz9yQikzooP"),
    feeRecipient: new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM"),
    initialVirtualTokenReserves: 1073000000000000n,
    initialVirtualSolReserves: 30000000000n,
    initialRealTokenReserves: 793100000000000n,
    tokenTotalSupply: 1000000000000000n,
    feeBasisPoints: 100n
}

export {
    GlobalAccount
}

export const global_mint = new PublicKey("p89evAyzjd9fphjJx7G3RFA48sbZdpGEppRcfRNpump")
export const PUMP_PROGRAM = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");