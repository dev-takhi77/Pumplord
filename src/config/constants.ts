import dotenv from "dotenv";
dotenv.config();

try {
    dotenv.config();
} catch (error) {
    console.error("Error loading environment variables:", error);
    process.exit(1);
}


export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
export const API_PREFIX = process.env.API_PREFIX || '/api';
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const MONGO_URL = process.env.MONGO_URL;