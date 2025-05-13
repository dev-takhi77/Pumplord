import {Document} from "mongoose";

export interface IInvite extends Document {
    key: string;
    used: boolean;
}