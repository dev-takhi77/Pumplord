import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { VanityService } from '../services/vanity';
import { IVanityData } from '../types/vanity';

export class VanityController {
    private vanityService: VanityService;

    constructor() {
        this.vanityService = new VanityService();
    }

    public create = async (req: Request, res: Response): Promise<Response> => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const vanityData: IVanityData = req.body;
            const vanityAddr = await this.vanityService.create(vanityData);
            console.log("🚀 ~ VanityController ~ create= ~ vanityAddr:", vanityAddr)
            return res.status(201).json(vanityAddr);
        } catch (error) {
            return res.status(400).json({ message: (error as Error).message });
        }
    };

    public getVanityList = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { user } = req.params;
            const result = await this.vanityService.getVanityList(user);
            if (result.success) {
                return res.json(result.vanityList);
            } else {
                return res.status(500).json({ message: 'Server error' });
            }
        } catch (error) {
            return res.status(500).json({ message: 'Server error' });
        }
    };
}