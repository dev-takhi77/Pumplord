import { Namespace, Server } from 'socket.io'

import TokenSocketHandler from './token.socket-controller'
import { ESOCKET_NAMESPACE, ETokenEvents, IProjectListener } from './constant'

class TokenSocketListener {
    private socketServer: Namespace

    constructor(socketServer: Server) {
        this.socketServer = socketServer.of(ESOCKET_NAMESPACE.project)
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
            socket.on(ETokenEvents.project, async (data: IProjectListener) => {
                tokenSocketHandler.startCronJob(data);
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
