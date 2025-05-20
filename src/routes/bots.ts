import { Router } from 'express';
import { check } from 'express-validator';
import { BotsController } from '../controllers/bots';

const router = Router();
const botsController = new BotsController();

// @route   POST /api/bots/volume
// @desc    run bots
// @access  Public
router.post(
    '/volume',
    [
        check('mainKp', 'mainKp is required').not().isEmpty(),
        check('baseMint', 'baseMint is required').not().isEmpty(),
        check('distSolAmount', 'distSolAmount is required').not().isEmpty(),
        check('id', 'id is required').not().isEmpty(),
    ],
    botsController.volumeBot
);

export default router;