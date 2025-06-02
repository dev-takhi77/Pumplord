export enum ETokenEvents {
    auth = 'auth',
    notifyError = 'notify-error',
    disconnect = 'disconnect',
    stop = 'stop',
    project = 'project',
    tokenInfo = 'token-info',
}

export enum ESOCKET_NAMESPACE {
    project = '/project',
}

export interface IProjectListener {
    user: string;
    project: string;
    token: string;
}

export interface IHolderData {
    account: string;
    type: string;
    tokenAmount: number;
    solPercentage: number;
}