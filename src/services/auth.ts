import User from '../models/user';
import { IUser } from '../types/user';
import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
import { LoginUserDto, RegisterUserDto } from '../types/auth.dto';

config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export class AuthService {
    public async register(userData: RegisterUserDto): Promise<{ token: string }> {
        // Check if user exists
        let user = await User.findOne({ email: userData.email });
        if (user) {
            throw new Error('User already exists');
        }

        // Check if username is taken
        user = await User.findOne({ username: userData.username });
        if (user) {
            throw new Error('Username already taken');
        }

        // Create new user
        user = new User(userData);
        await user.save();

        // Create and return JWT
        const token = this.generateToken(user.id);
        return { token };
    }

    public async login(loginData: LoginUserDto): Promise<{ token: string; user: Omit<IUser, 'password'> }> {
        // Check if user exists
        const user = await User.findOne({ email: loginData.email }).select('+password');
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