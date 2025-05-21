import { Schema, model } from "mongoose";
import { IHistory } from "../types/history";

// Main Token schema
const HistorySchema: Schema = new Schema({
    signature: { type: String, required: true, unique: true },
    wallet: { type: String, required: true },
    type: { type: String, required: true },
    sol_amount: { type: Number, required: true },
    toeken_amount: { type: Number, required: true },
    created_at: { type: Date, required: true },
    token: { type: String, required: true, unique: true },
});

// Create the model
export default model<IHistory>('History', HistorySchema);
