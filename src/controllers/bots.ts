import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { BotsService } from '../services/bots';
import { IVolumeData } from '../types/bots';

export class BotsController {
    private botsService: BotsService;

    constructor() {
        this.botsService = new BotsService();
    }

    public volumeBot = async (req: Request, res: Response): Promise<Response> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const botsData: IVolumeData = req.body;
            await this.botsService.startVolumeBot(botsData);
            return res.status(201).json({ success: true });
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    };

    public volumeBotStop = async (req: Request, res: Response) => {
        try {
            const { user } = req.params;

            await this.botsService.stopVolumeBot(user);
        } catch (error) {
            return res.status(500).json({ message: (error as Error).message });
        }
    }

    public chargeSol = async (req: Request, res: Response) => {
        try {
            const { user, amount } = req.params;

            await this.botsService.chargeSol(user, Number(amount));
        } catch (error) {
            return res.status(500).json({ message: (error as Error).message });
        }
    }
}