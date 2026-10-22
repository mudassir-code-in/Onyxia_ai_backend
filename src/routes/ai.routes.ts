import express from 'express';
import { handleAiPrompt } from '../controllers/ai.controller.js';


export const aiRouter = express.Router();

aiRouter.post('/ai-response', handleAiPrompt);