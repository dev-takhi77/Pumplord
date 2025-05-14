import mongoose, { Schema, Model } from "mongoose";
import { IToken } from "../types/token";

// Main Token schema
const TokenSchema: Schema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true, unique: true },
    symbol: { type: String, required: true },
    decimal: { type: Number, default: 6 },
    description: { type: String, required: true },
    avatar: {
        type: String,
        required: true
        // default: "https://arweave.net/iap6ASZe2-Aw3tUFiuiCBS7DWtt0tlK2GNmn9ZVwXX8"
    },
    metadataUri: { type: String, required: true },
    supply: { type: Number, default: 1_000_000 },
    liquidity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    owner: { type: String },
    twitter: { type: String, default: "" },
    telegram: { type: String, default: "" },
    website: { type: String, default: "" },
    islaunch: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: "User" }
});

// Create the model
const TokenModel: Model<IToken> = mongoose.model<IToken>("token", TokenSchema);

export default TokenModel;