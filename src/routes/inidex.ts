import { Router } from 'express';
import healthCheckRouter from './healthCheck';

const router = Router();

router.use('/health', healthCheckRouter);

export default router;