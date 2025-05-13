import express from 'express';
import cors from 'cors';
import bodyParser from "body-parser";
// import router from 'routes/inidex';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares
app.use(cors());
// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use(process.env.API_PREFIX || '/', () => {
    console.log("start server!")
});

// app.use(process.env.API_PREFIX || '/api', router);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;