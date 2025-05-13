import { Schema, model, Document } from 'mongoose';

interface IInvite extends Document {
    key: string;
    used: boolean;
}

const InviteSchema = new Schema<IInvite>({
    key: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
});

export default model<IInvite>('Invite', InviteSchema);
