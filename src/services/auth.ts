import User from '../models/user';
import { IUser } from '../types/user';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { LoginUserDto, RegisterUserDto } from '../types/auth.dto';
import Invite from "../models/invite";

config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class AuthService {
    public async register(userData: RegisterUserDto): Promise<{ token: string }> {
        const { username, inviteKey } = userData;

        const invite = await Invite.findOne({ key: inviteKey, used: false });
        if (!invite) {
            throw new Error('Invalid or used invite key');
        }

        const user = await User.findOne({ username });
        if (user) {
            throw new Error('Username already taken');
        }

        // Create new user
        const newUser = new User(userData);
        await newUser.save();

        invite.used = true;
        await invite.save();

        // Create and return JWT
        const token = this.generateToken(newUser.id);
        return { token };
    }

    public async login(loginData: LoginUserDto): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
        // Check if user exists
        const user = await User.findOne({ username: loginData.username }).select('+password');
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Check password
        const isMatch = await user.comparePassword(loginData.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        // Create token and return user data (without password)
        const token = this.generateToken(user.id);
        const userWithoutPassword = user.toObject();
        delete (userWithoutPassword as { password?: string }).password;

        return { token, user: userWithoutPassword };
    }

    private generateToken(userId: string): string {
        return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '1h' });
    }
}