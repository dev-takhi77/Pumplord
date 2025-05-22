import { Namespace } from 'socket.io'
import cron from 'node-cron'

import { ETokenEvents, IHolderData, IProjectListener } from './constant'
import { TokenService } from '../../services/token'
import { HistoryService } from '../../services/history'
import { WalletService } from '../../services/wallet'

class TokenSocketHandler {
    private socketNameSpace: Namespace
    private tokenService: TokenService;
    private historyService: HistoryService;
    private walletService: WalletService;

    constructor(socketNameSpace: Namespace) {
        this.socketNameSpace = socketNameSpace;
        this.tokenService = new TokenService();
        this.historyService = new HistoryService();
        this.walletService = new WalletService();
    }

    public startCronJob(data: IProjectListener) {
        const { user, project, token } = data;

        // Run this job every 1 seconds (for testing)
        cron.schedule('*/1 * * * * *', async () => {
            try {
                const data = await this.tokenService.getTokenList(user); // Use stored user

                const holders = this.walletService.getTopHolders(token);

                if (data.success) {
                    console.log("Token Lists to emit: ", data.tokenList);
                    this.socketNameSpace.emit(ETokenEvents.project, {
                        tokenList: data.tokenList,
                        funding: data.fundAmount,
                        volume: data.volumeAmount,
                        holders
                    });
                }
            } catch (error) {
                console.log("Cron Job Emit error: ", error);
            }
        });
    }

    public getHistory = async (token: string) => {
        // Run this job every 1 seconds (for testing)
        // cron.schedule('*/1 * * * * *', async () => {
        //     try {
        //         const data = await this.historyService.getHistory(token);
        //         this.socketNameSpace.emit(ETokenEvents.sendHistory, {
        //             history: data
        //         });
        //     } catch (error) {
        //         console.log("Get History error: ", error);
        //     }
        // });
    }

    public disconnectHandler = async () => { }
}

export default TokenSocketHandler
