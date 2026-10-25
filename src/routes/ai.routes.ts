import express from 'express';
import { handleAiPrompt } from '../controllers/ai.controller.js';
import { checkAccessToken } from '../middlewares/auth.middleware.js';


export const aiRouter = express.Router();

aiRouter.post('/ai-response', checkAccessToken, handleAiPrompt);