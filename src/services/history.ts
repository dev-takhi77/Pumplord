import History from '../models/history';
import WebSocket = require("ws");
import { config } from 'dotenv';
import { IHistory, IHistoryData } from '../types/history';
import { Keypair } from '@solana/web3.js';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { GEYSER_RPC } from '../config/constants';

config();

const ws = new WebSocket(GEYSER_RPC);

export class HistoryService {
    public async saveHisotry(token: string) {

        const walletKp = Keypair.generate();

        function sendRequest(ws: WebSocket) {
            const request = {
                jsonrpc: "2.0",
                id: 420,
                method: "transactionSubscribe",
                params: [
                    {
                        failed: false,
                        accountInclude: ["6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"]
                    },
                    {
                        commitment: "processed",
                        encoding: "jsonParsed",
                        transactionDetails: "full",
                        maxSupportedTransactionVersion: 0
                    }
                ]
            };
            ws.send(JSON.stringify(request));
        }

        ws.on('open', function open() {
            console.log('WebSocket is open');
            sendRequest(ws);  // Send a request once the WebSocket is open
        });

        ws.on('message', async function incoming(data) {
            const messageStr = data.toString('utf8');
            try {
                const messageObj = JSON.parse(messageStr);

                const result = messageObj.params.result;
                const logs = result.transaction.meta.logMessages;
                const signature = result.signature; // Extract the signature
                const accountKeys = result.transaction.transaction.message.accountKeys.map((ak: { pubkey: any; }) => ak.pubkey);
                const instructions = result.transaction.meta.innerInstructions;
            } catch (error) {
                console.error("Error parsing message:", error);
            }
        });
        
        ws.on('error', function error(err) {
            console.error('WebSocket error:', err);
        }
    }

    public async getHistory(token: string): Promise<IHistory[]> {
        try {
            const histories = await History.find({ token });

            return histories;
        } catch (error) {
            console.log("🚀 ~ TokenService ~ getWalletList ~ error:", error)
            return [];
        }
    }
}
