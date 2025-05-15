import mongoose, { Schema, Model } from "mongoose";
import { IWallet } from "../types/wallet";

// Main Token schema
const WalletSchema: Schema = new Schema({
    privatekey: { type: String, required: true, unique: true },
    publickey: { type: String, required: true, unique: true },
    type: { type: String, default: "dev" },
    user: { type: Schema.Types.ObjectId, ref: "User" }
});

// Create the model
const WalletModel: Model<IWallet> = mongoose.model<IWallet>("wallet", WalletSchema);

export default WalletModel;