import { AppDataSource } from 'db/data-source';
import app from './app';
import { PORT } from './config/constants';

AppDataSource.initialize()
    .then(() => {
        console.log('Database connected');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err: any) => {
        console.error('Database connection failed', err);
    });