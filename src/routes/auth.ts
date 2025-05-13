import { Router } from 'express';
import { check } from 'express-validator';
import { AuthController } from '../controllers/auth';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const authController = new AuthController();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        // check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    authController.register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    authController.login
);

// @route   GET /api/auth/user
// @desc    Get current user
// @access  Private
router.get('/user', authMiddleware, authController.getCurrentUser);

export default router;