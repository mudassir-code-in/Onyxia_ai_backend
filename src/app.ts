import express from 'express';
import { authRouter } from './routes/auth.routes.js';
import cookieParser from 'cookie-parser'
import cors from 'cors';
import { aiRouter } from './routes/ai.routes.js';
import { healthRouter } from './routes/server.health.routes.js';


export const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'https://onyxiaai-nu.vercel.app',
    credentials: true
}))

//Routes
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);
app.use('/api/health', healthRouter);