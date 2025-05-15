import { Schema, model } from 'mongoose';
import { IVanity } from '../types/vanity';

const VanitySchema = new Schema<IVanity>({
    privateKey: { type: String, required: true, unique: true },
    publicKey: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
    user: { type: String, required: true },
});

export default model<IVanity>('Vanity', VanitySchema);
