import { Router } from 'express';
import { check } from 'express-validator';
import { WalletController } from '../controllers/wallet';

const router = Router();
const walletController = new WalletController();

// @route   POST /api/vanity/create
// @desc    Create vanity
// @access  Public
router.post(
    '/create',
    [
        check('privatekey', 'Privatekey is required').not().isEmpty(),
        check('user', 'User is required').not().isEmpty(),
    ],
    walletController.create
);

// @route   GET /api/wallet:user
// @desc    Get current wallet list
// @access  Public
router.get('/:user', walletController.getWalletList);

export default router;