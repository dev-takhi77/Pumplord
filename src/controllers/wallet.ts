import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { WalletService } from '../services/wallet';
import { IWalletData } from '../types/wallet';

export class WalletController {
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
    }

    public create = async (req: Request, res: Response): Promise<Response> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const walletData: IWalletData = req.body;
            const walletPub = await this.walletService.create(walletData);
            return res.status(201).json(walletPub);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    };

    public getWalletList = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { user, type } = req.params;

            const result = await this.walletService.getWalletList(user, type);
            if (result.success) {
                return res.json(result.walletList);
            } else {
                return res.status(500).json({ message: 'Server error' });
            }
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    };
}