import express from 'express';
import { checkHealth } from '../controllers/server.health.controller.js';


export const healthRouter = express.Router();


healthRouter.get('/check-health', checkHealth);