import { Schema, model } from 'mongoose';
import { IVanity } from '../types/vanity';

const VanitySchema = new Schema<IVanity>({
    address: { type: String, required: true, unique: true },
    user: { type: String, required: true },
});

export default model<IVanity>('Vanity', VanitySchema);
