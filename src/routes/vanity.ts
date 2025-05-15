import { Router } from 'express';
import { VanityController } from '../controllers/vanity';

const router = Router();
const vanityController = new VanityController();

// @route   POST /api/vanity/create
// @desc    Create vanity
// @access  Public
router.post(
    '/create',
    vanityController.create
);

// @route   GET /api/vanity/:user
// @desc    Get current vanity list
// @access  Public
router.get('/:user', vanityController.getVanityList);

export default router;