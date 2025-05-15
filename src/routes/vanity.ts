import { Router } from 'express';
import { VanityController } from '../controllers/vanity';
import { check } from 'express-validator';

const router = Router();
const vanityController = new VanityController();

// @route   POST /api/vanity/create
// @desc    Create vanity
// @access  Public
router.post(
    '/create',
    [
        check('user', 'User is required').not().isEmpty(),
    ],
    vanityController.create
);

// @route   GET /api/vanity/:user
// @desc    Get current vanity list
// @access  Public
router.get('/:user', vanityController.getVanityList);

export default router;