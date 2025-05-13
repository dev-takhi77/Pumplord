import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthService } from '../services/auth';
import { LoginUserDto, RegisterUserDto } from '../types/auth.dto';

export class AuthController {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    public register = async (req: Request, res: Response): Promise<Response> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const userData: RegisterUserDto = req.body;
            const { token } = await this.authService.register(userData);
            return res.status(201).json({ token });
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    };

    public login = async (req: Request, res: Response): Promise<Response> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const loginData: LoginUserDto = req.body;
            const { token, user } = await this.authService.login(loginData);
            return res.json({ token, user });
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    };

    public getCurrentUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const user = req.user;
            return res.json(user);
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    };
}