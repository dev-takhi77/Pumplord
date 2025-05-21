export interface IHistory {
    wallet: string;
    type: string;
    sol_amount: number;
    token_amount: number;
    signature: string;
    created_at: Date;
    token_id: string;
    user_id: string;
}

export interface IHistoryData {
    user: string;
    token: string;
}
