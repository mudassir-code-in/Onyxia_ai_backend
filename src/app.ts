import express from 'express';
import { authRouter } from './routes/auth.routes.js';
import cookieParser from 'cookie-parser'


export const app = express();


app.use(express.json());
app.use(cookieParser());

//Routes
app.use('/api/auth', authRouter);