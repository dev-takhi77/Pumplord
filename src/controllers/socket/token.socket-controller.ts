import { Namespace, Socket } from 'socket.io'
import cron from 'node-cron'

import { ETokenEvents } from './constant'
import { TokenService } from '../../services/token'

class TokenSocketHandler {
    private socketNameSpace: Namespace

    constructor(socketNameSpace: Namespace, socket?: Socket) {
        // this.socket = socket
        this.socketNameSpace = socketNameSpace
        this.task.start()
    }

    // Run this job every 2:00 am
    private task = cron.schedule('*/5 * * * * *', async () => {
        try {

            // TODO; price fetching api
            const token_lists = await TokenService.findAll()

            console.log("Token Lists to emit: ", token_lists.message)

            this.socketNameSpace.emit(ETokenEvents.tokenInfo, { token_list: token_lists.data })

        } catch (error) {
            console.log("Cron Job Emit error: ", error)
        }
    })

    public disconnectHandler = async () => { }
}

export default TokenSocketHandler
