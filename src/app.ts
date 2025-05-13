import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import router from 'routes/inidex';
import { errorHandler } from '@middlewares/errorHandler';
import { notFoundHandler } from '@middlewares/notFoundHandler';

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(process.env.API_PREFIX || '/api', router);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;