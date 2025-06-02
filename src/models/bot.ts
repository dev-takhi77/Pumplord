import { Schema, model } from "mongoose";
import { IBot } from "../types/bot";

// Main Token schema
const BotSchema: Schema = new Schema({
    name: { type: String },
    speed_mode: { type: Number, default: 1 },
    bump_amount: { type: Number, default: 0.02 },
    burst: { type: Number, default: 3 },
    bot_status: { type: String, default: true },
    bot_used: { type: Boolean, default: false },
    running_num: { type: Number, default: 0 },
    processing_num: { type: Number, default: 0 },
    user: { type: Schema.Types.ObjectId, ref: "User" }
});

// Create the model
export default model<IBot>('Bot', BotSchema);