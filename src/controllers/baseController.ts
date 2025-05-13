import { Request, Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler';

export abstract class BaseController {
    protected abstract execute(req: Request, res: Response): Promise<void | any>;

    public async handler(req: Request, res: Response): Promise<void> {
        try {
            await this.execute(req, res);
        } catch (error) {
            console.error(`[BaseController]: Uncaught controller error`);
            console.error(error);
            this.fail(res, 'An unexpected error occurred');
        }
    }

    protected ok<T>(res: Response, dto?: T) {
        if (dto) {
            res.status(200).json(dto);
        } else {
            res.sendStatus(200);
        }
    }

    protected fail(res: Response, error: Error | string) {
        res.status(500).json({
            message: error.toString(),
        });
    }
}