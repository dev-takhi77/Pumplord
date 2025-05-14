import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TokenService } from '../services/token';
import { ILaunchData, IToken } from '../types/token';

export class TokenController {
    private tokenService: TokenService;

    constructor() {
        this.tokenService = new TokenService();
    }

    public create = async (req: Request, res: Response): Promise<Response> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const tokenData: IToken = req.body;
            const tokenTmp = await this.tokenService.create(tokenData);
            return res.status(201).json({ tokenTmp });
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    };

    public launch = async (req: Request, res: Response): Promise<Response> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const launchData: ILaunchData = req.body;
            const tokenInfo = await this.tokenService.launch(launchData);
            return res.json({ tokenInfo });
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