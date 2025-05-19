import { Server as SocketIOServer } from 'socket.io'
import { Server } from 'http'

import TokenSocketListener from './controllers/socket/token.listener'
import { corsOptionsSocket } from './config/constants'

export class Socket {
    private _socket: SocketIOServer

    constructor(httpServer: Server) {
        this._socket = new SocketIOServer(httpServer, {
            cors: {
                origin: corsOptionsSocket,
                methods: ['GET', 'POST'],
                credentials: true,
            },
            // parser: customParser,
        })
        this._start()
    }

    private _start() {
        try {
            new TokenSocketListener(this._socket)
        } catch (error) {
            // logger.error(`Error starting socket server: ${error}`)
        }
    }
}
