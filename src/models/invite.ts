import { Schema, model } from 'mongoose';
import { IInvite } from '../types/invite';

const InviteSchema = new Schema<IInvite>({
    key: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
});

export default model<IInvite>('Invite', InviteSchema);
