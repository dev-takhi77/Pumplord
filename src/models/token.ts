import mongoose, { Schema, Model } from "mongoose";
import { IToken } from "../types/token";

// Socials sub-schema
const SocialsSchema = new Schema({
    twitter: { type: String, default: "" },
    telegram: { type: String, default: "" },
    website: { type: String, default: "" },
});

// Main Token schema
const TokenSchema: Schema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true, unique: true },
    symbol: { type: String, required: true },
    decimal: { type: Number, default: 6 },
    decription: { type: String, required: true },
    avatar: {
        type: String,
        required: true
        // default: "https://arweave.net/iap6ASZe2-Aw3tUFiuiCBS7DWtt0tlK2GNmn9ZVwXX8"
    },
    supply: { type: Number, default: 1_000_000 },
    liquidity: { type: Number, default: 0 },
    marketcap: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    buyvolume: { type: Number, default: 0 },
    sellvolume: { type: Number, default: 0 },
    owner: { type: String },
    socials: { type: SocialsSchema, default: () => ({}) },
    islaunch: { type: Boolean, default: false }
});

// Create the model
const TokenModel: Model<IToken> = mongoose.model<IToken>("token", TokenSchema);

export default TokenModel;