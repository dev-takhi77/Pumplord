import express from 'express';
import cors from 'cors';
import bodyParser from "body-parser";
import morgan from 'morgan';
import authRoutes from './routes/auth';
import tokenRoutes from './routes/token';
import walletRoutes from './routes/wallet';
import vanityRoutes from './routes/vanity';
import botsRoutes from './routes/bots';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Routes
// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
    res.send("Backend Server is Running now!");
});

app.use('/api/auth', authRoutes);
app.use('/api/token', tokenRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/vanity', vanityRoutes);
app.use('api/bots', botsRoutes)

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
