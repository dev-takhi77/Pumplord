import { Namespace } from 'socket.io'
import cron from 'node-cron'

import { ETokenEvents } from './constant'
import { TokenService } from '../../services/token'
import { HistoryService } from '../../services/history'

class TokenSocketHandler {
    private socketNameSpace: Namespace
    private tokenService: TokenService;
    private historyService: HistoryService;

    constructor(socketNameSpace: Namespace) {
        this.socketNameSpace = socketNameSpace;
        this.tokenService = new TokenService();
        this.historyService = new HistoryService();
    }

    public startCronJob(user: string) {
        // Run this job every 5 seconds (for testing)
        cron.schedule('*/5 * * * * *', async () => {
            try {
                const data = await this.tokenService.getTokenList(user); // Use stored user
                if (data.success) {
                    console.log("Token Lists to emit: ", data.tokenList);
                    this.socketNameSpace.emit(ETokenEvents.tokenInfo, {
                        tokenList: data.tokenList
                    });
                }
            } catch (error) {
                console.log("Cron Job Emit error: ", error);
            }
        });
    }

    public getHistory = async (token: string) => {
        // Run this job every 1 seconds (for testing)
        cron.schedule('*/1 * * * * *', async () => {
            try {
                const data = await this.historyService.getHistory(token);
                this.socketNameSpace.emit(ETokenEvents.sendHistory, {
                    history: data
                });
            } catch (error) {
                console.log("Get History error: ", error);
            }
        });
    }

    public disconnectHandler = async () => { }
}

export default TokenSocketHandler
