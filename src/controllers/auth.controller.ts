import jwt from 'jsonwebtoken';
import redisClient from '../config/redis.config.js';
import type { Request, Response } from 'express';
import { userModel } from '../models/user.model.js';
import crypto from 'crypto';




export async function login(req: Request, res: Response): Promise<any> {
    try {
        const { name, email, avatar } = req.body;


        const user = await userModel.findOne({ email });


        // if there is a user in the database
        if (user) {

            const sessionData = {
                userId: user._id,
                userAgent: req.headers['user-agent'],
                ip: req.ip
            }

            const sessionId = crypto.randomUUID();
            const redisKey: string = `session:${user._id}:${sessionId}`;

            await redisClient.set(redisKey, JSON.stringify(sessionData), {
                EX: 604800
            });


            const refreshToken = jwt.sign({
                userId: user._id,
                sessionId: sessionId
            }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });


            const accessToken = jwt.sign({
                userId: user._id,
                sessionId: sessionId
            }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });


            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            });

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'
            });

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


        //if there is no user in the database
        const newUser = await userModel.create({
            name,
            email,
            avatar
        });


        const sessionData = {
            userId: newUser._id,
            userAgent: req.headers['user-agent'],
            ip: req.ip
        }

        const sessionId = crypto.randomUUID();
        const redisKey: string = `session:${newUser._id}:${sessionId}`;

        await redisClient.set(redisKey, JSON.stringify(sessionData), {
            EX: 604800
        });


        const refreshToken = jwt.sign({
            userId: newUser._id,
            sessionId: sessionId
        }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });


        const accessToken = jwt.sign({
            userId: newUser._id,
            sessionId: sessionId
        }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '15m' });


        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        return res.status(201).json({
            success: true,
            message: 'User Registerd successfully',
            user: {
                name: newUser.name,
                email: newUser.email,
                avatar: newUser.avatar
            }
        });




    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}


export async function logout(req: Request, res: Response): Promise<any> {
    try {
        
    } catch (error) {
        console.error(error);
    }
}