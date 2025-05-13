import app from './app';
import http from "http";
import { PORT } from './config/constants';
import { connectMongoDB } from './config/db';

// Connect to the MongoDB database
connectMongoDB();

const server = http.createServer(app);

// Start the Express server to listen on the specified port
server.listen(PORT, () => {
    console.log(`server is listening on ${PORT}`);
});