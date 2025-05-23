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
        check('token', 'Token is required').not().isEmpty(),
        check('status', 'Status is required').not().isEmpty(),
        check('user', 'user is required').not().isEmpty(),
    ],
    botsController.volumeBot
);

// @route   GET /api/bots/volume/:user
// @desc    stop bots
// @access  Public
router.get(
    '/volume',
    botsController.volumeBotStop
);

// @route   GET /api/bots/volume/:user/:amount
// @desc    stop bots
// @access  Public
router.get(
    '/charge',
    botsController.chargeSol
);

export default router;