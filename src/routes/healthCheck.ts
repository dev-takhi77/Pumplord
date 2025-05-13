import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Request, Response } from 'express';

const router = Router();

interface HealthCheckResponse {
    status: string;
    timestamp: string;
}

router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
        const response: HealthCheckResponse = {
            status: 'OK',
            timestamp: new Date().toISOString(),
        };
        res.json(response);
    })
);

export default router;