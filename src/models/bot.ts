import { Schema, model } from "mongoose";
import { IBot } from "../types/bots";

// Main Token schema
const BotSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    status: { type: String, default: false },
    user: { type: Schema.Types.ObjectId, ref: "User" }
});

// Create the model
export default model<IBot>('Bot', BotSchema);