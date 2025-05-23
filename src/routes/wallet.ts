import { Router } from 'express';
import { check } from 'express-validator';
import { WalletController } from '../controllers/wallet';

const router = Router();
const walletController = new WalletController();

// @route   POST /api/wallet/create
// @desc    Create wallet
// @access  Public
router.post(
    '/create',
    [
        check('type', 'Type is required').not().isEmpty(),
        check('user', 'User is required').not().isEmpty(),
    ],
    walletController.create
);

// @route   POST /api/wallet/redeem
// @desc    Redeem sol of all wallets
// @access  Public
router.post(
    '/redeem',
    [
        check('user', 'User is required').not().isEmpty(),
    ],
    walletController.redeemSol
);

// @route   POST /api/wallet/selected-redeem
// @desc    Redeem sol of selected wallets
// @access  Public
router.post(
    '/selected-redeem',
    [
        check('selectedWals', 'Selected wallets is required').not().isEmpty(),
        check('user', 'User is required').not().isEmpty(),
    ],
    walletController.selectedRedeemSol
);

// @route   GET /api/wallet/:user/:type
// @desc    Get current wallet list
// @access  Public
router.get('/:user/:type', walletController.getWalletList);

export default router;