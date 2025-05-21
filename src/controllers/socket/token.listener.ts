import { Namespace, Server } from 'socket.io'

import TokenSocketHandler from './token.socket-controller'
import { ESOCKET_NAMESPACE, ETokenEvents } from './constant'

class TokenSocketListener {
    private socketServer: Namespace

    constructor(socketServer: Server) {
        this.socketServer = socketServer.of(ESOCKET_NAMESPACE.token)
        this.subscribeListener()
        this.tokenSocketTrigger()
    }

    private subscribeListener(): void {
        this.socketServer.on('connection', (socket: any) => {
            console.log("socket connected!")
            const tokenSocketHandler = new TokenSocketHandler(
                this.socketServer,
            )

            // Get token info
            socket.on(ETokenEvents.user, async (data: string) => {
                tokenSocketHandler.startCronJob(data);
            })

            socket.on(ETokenEvents.getHistory, async (data: string) => {
                tokenSocketHandler.getHistory(data);
            })

            // Disconnect Handler
            socket.on(ETokenEvents.disconnect, async () => {
                tokenSocketHandler.disconnectHandler()
            })
        })
    }

    private tokenSocketTrigger(): void {
        const tokenSocketHandler = new TokenSocketHandler(this.socketServer)
    }
}

export default TokenSocketListener
