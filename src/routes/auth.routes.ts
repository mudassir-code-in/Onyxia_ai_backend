import express from 'express';
import { login, logout } from '../controllers/auth.controller.js';
import { checkAccessToken } from '../middlewares/auth.middleware.js';


// Created express Router
export const authRouter = express.Router();


// handle routes
authRouter.post('/login', login);
authRouter.post('/logout', checkAccessToken, logout);




