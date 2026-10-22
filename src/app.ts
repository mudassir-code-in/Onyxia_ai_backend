import express from 'express';
import { authRouter } from './routes/auth.routes.js';
import cookieParser from 'cookie-parser'
import cors from 'cors';
import { aiRouter } from './routes/ai.routes.js';


export const app = express();


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

//Routes
app.use('/api/auth', authRouter);
app.use('/api/ai', aiRouter);