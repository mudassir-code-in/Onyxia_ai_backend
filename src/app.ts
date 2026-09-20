import express from 'express';
import { authRouter } from './routes/auth.routes.js';


export const app = express();


app.use(express.json());

//Routes
app.use('/api/auth', authRouter);