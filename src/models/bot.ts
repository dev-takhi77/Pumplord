import { Schema, model } from "mongoose";
import { IBot } from "../types/bots";

// Main Token schema
const BotSchema: Schema = new Schema({
    name: { type: String },
    speed_mode: { type: Number, default: 1 },
    bump_amount: { type: Number, default: 0.02 },
    burst: { type: Number, default: 3 },
    status: { type: String, default: true },
    used: { type: Boolean, default: false },
    user: { type: Schema.Types.ObjectId, ref: "User" }
});

// Create the model
export default model<IBot>('Bot', BotSchema);