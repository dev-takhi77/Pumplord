import { Namespace } from 'socket.io'
import cron from 'node-cron'

import { ETokenEvents } from './constant'
import { TokenService } from '../../services/token'

class TokenSocketHandler {
    private socketNameSpace: Namespace
    private tokenService: TokenService;

    constructor(socketNameSpace: Namespace) {
        this.socketNameSpace = socketNameSpace
        this.tokenService = new TokenService()
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

    public disconnectHandler = async () => { }
}

export default TokenSocketHandler
