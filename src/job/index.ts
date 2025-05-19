import { HistoryJob } from './history.job'

export class Jobs {
    /**
     * Initialize Jobs
     */
    public static initialize(): void {
        // run history task
        this._historyTask()
    }

    private static _historyTask(): void {
        // History Job
        const job = HistoryJob.getTask()
        job.start()
    }
}
