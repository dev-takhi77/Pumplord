import { Schema, model } from "mongoose";
import { IDistWallet } from "../types/bot";

// Main Token schema
const DistributeSchema: Schema = new Schema({
    privatekey: { type: String, required: true, unique: true },
    publickey: { type: String, required: true, unique: true },
    amount: { type: Number, default: 0 },
    token_id: { type: Schema.Types.ObjectId, ref: "Token" }
});

// Create the model
export default model<IDistWallet>('Distribute', DistributeSchema);
