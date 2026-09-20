import 'dotenv/config';
import { app } from "./app.js";
import { connectDB } from "./config/db.config.js";
import { connectRedis } from './config/redis.config.js';


connectDB();
connectRedis();

const PORT = 5000;


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})