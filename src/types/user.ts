import { Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password: string;
    createdAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}