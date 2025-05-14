import { Router } from 'express';
import { check } from 'express-validator';
import { TokenController } from '../controllers/token';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const tokenController = new TokenController();

// @route   POST /api/token/create
// @desc    Create token
// @access  Public
router.post(
    '/create',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('symbol', 'Symbol is required').not().isEmpty(),
        check('description', 'Description is required').not().isEmpty(),
        check('avatar', 'Avatar is required').not().isEmpty(),
        check('metadataUri', 'MetadataUri is required').not().isEmpty()
    ],
    tokenController.create
);

// @route   POST /api/token/launch
// @desc    Launch token
// @access  Public
router.post(
    '/launch',
    [
        check('token', 'Token is required').not().isEmpty(),
        check('fundingWal', 'Funding wallet is required').not().isEmpty(),
        check('devWal', 'Dev wallet is required').not().isEmpty(),
    ],
    tokenController.launch
);

// @route   GET /api/token:owner
// @desc    Get current token list
// @access  Public
router.get('/:owner', tokenController.getTokenList);

// @route   GET /api/token/launch:owner
// @desc    Get current token list for launching
// @access  Private
router.get('/launch:owner', tokenController.getTokenLaunchList);

export default router;