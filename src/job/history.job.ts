import cron from 'node-cron'
import { TokenService } from '../services/token'

const tokenService = new TokenService()

export class HistoryJob {
    /**
     * Get Example Task
     */
    public static getTask(): cron.ScheduledTask {
        const cronExpression: string = '*/30 * * * * *'

        // Run this job every 30 sec
        const task = cron.schedule(cronExpression, async () => {
            // fetching history
            await tokenService.updateTokenInfo()
        })
        return task
    }
}
