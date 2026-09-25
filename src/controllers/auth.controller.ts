import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.config.js';
import type { Request, Response } from 'express';
import { userModel } from '../models/user.model.js';
import crypto from 'crypto';



// Login api
export async function login(req: Request, res: Response): Promise<any> {
    try {
        const { name, email, avatar } = req.body;


        const user = await userModel.findOne({ email });


        // if there is a user in the database
        if (user) {

            // This is session Data
            const sessionData = {
                userId: user._id,
                userAgent: req.headers['user-agent'],
                ip: req.ip
            }

            // Creating session id
            const sessionId = crypto.randomUUID();

            // Redis key
            const redisKey: string = `session:${user._id}:${sessionId}`;

            // Set Session in the Redis
            await redisClient.set(redisKey, JSON.stringify(sessionData), {
                EX: 604800
            });

            // Generate refreshToken
            const refreshToken = jwt.sign({
                userId: user._id,
                sessionId: sessionId
            }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

            // Generate accesstoken
            const accessToken = jwt.sign({
                userId: user._id,
                sessionId: sessionId
            }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });

            // Set refreshToken in cookies
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            });

            // Set accessToken in cookies
            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            });

            // Return final Response of if user exists
            return res.status(200).json({
                success: true,
                message: 'User login successfully',
                user: {
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar
                }
            });

        }

        // This workflow for new user

        //if there is no user in the database
        const newUser = await userModel.create({
            name,
            email,
            avatar
        });

        // This is session Data
        const sessionData = {
            userId: newUser._id,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        }

        // Create session id
        const sessionId = crypto.randomUUID();

        // Redis key
        const redisKey: string = `session:${newUser._id}:${sessionId}`;

        // Set session in the Redis
        await redisClient.set(redisKey, JSON.stringify(sessionData), {
            EX: 604800
        });

        // Generate refreshToken
        const refreshToken = jwt.sign({
            userId: newUser._id,
            sessionId: sessionId
        }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

        // Generate accessToken
        const accessToken = jwt.sign({
            userId: newUser._id,
            sessionId: sessionId
        }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });

        // Set refreshToken in cookies
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        // Set accessToken in cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        // Return final Response fron new user
        return res.status(201).json({
            success: true,
            message: 'User Registerd successfully',
            user: {
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar
            }
        });




    } catch (error: any) {
        console.error('Login api error', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}


// Logout api
export async function logout(req: Request, res: Response): Promise<any> {
    try {

        //decoded comes from middleware
        const decoded = (req as any).user;

        // Redis key
        const redisKey: string = `session:${decoded.userId}:${decoded.sessionId}`;

        // Delete session from Redis
        await redisClient.del(redisKey);

        // both accessToken and refreshToken clear form cookies
        res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'none' });
        res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });

        // Final response
        return res.status(200).json({
            success: true,
            message: 'User Logout successfully'
        })

    } catch (error: any) {
        console.error('Logout api error', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

// Refresh Token api
export async function refreshToken(req: Request, res: Response): Promise<any> {
    try {
        // Get refreshToken in the cookies
        const refreshToken = req.cookies.refreshToken;

        // If there is no refreshToken in the cookies
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Token not found'
            });
        }

        // If there is refreshToken in the cookies. Verify this
        let decoded: any;

        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
        } catch (error: any) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }


        // Retrieve Session from the Redis
        const sessionData = await redisClient.get(`session:${decoded.userId}:${decoded.sessionId}`);

        // If there is no sessionData in the Redis
        if (!sessionData) {
            return res.status(401).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Parse the sessionData
        const session = JSON.parse(sessionData);

        // Check the userAgent
        if (session.userAgent !== req.headers['user-agent']) {
            // delete the session
            await redisClient.del(`session:${decoded.userId}:${decoded.sessionId}`);

            // Delete both accessToken and refreshToken
            res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none' });
            res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'none' });

            return res.status(401).json({
                success: false,
                message: 'Security Alert: Device mismatch detected! Session terminated.'
            });
        }

        // Set session in the Redis for session update
        await redisClient.set(`session:${decoded.userId}:${decoded.sessionId}`, JSON.stringify(session), {
            EX: 604800
        });

        // Generate new refreshTokem
        const newRefreshToken = jwt.sign({
            userId: decoded.userId,
            sessionId: decoded.sessionId
        }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

        // Generate accessToken
        const accessToken = jwt.sign({
            userId: decoded.userId,
            sessionId: decoded.sessionId
        }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });


        // Set refreshToken in the cookies
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });


        // Set accessToken in the cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        // Final response
        return res.status(200).json({
            success: true,
            message: 'Access Token generation successful'
        })

    } catch (error: any) {
        console.error('Refresh Token api error', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


//is user login. checkAuth api
export async function checkAuth(req: Request, res: Response) {
    try {

        const decoded = (req as any).user;

        // Find user
        const user = await userModel.findById(decoded.userId);

        // If there is no user in the Database
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Final response
        return res.status(200).json({
            success: true,
            user: {
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        })

    } catch (error: any) {
        console.error('chekAuth api error', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}