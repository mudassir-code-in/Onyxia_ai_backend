import redisClient from "../config/redis.config.js";
import jwt from 'jsonwebtoken';
import type { Response, Request } from "express";


export async function checkAccessToken(req: Request, res: Response, next: any){
try {

    // Retrieve access token from cookies
    const accessToken = req.cookies.accessToken;

    // If there is no token in cookies
    if(!accessToken){
        return res.status(401).json({
            success: false,
            message: 'Token not found'
        });
    }

    // Verify accessToken
    let decoded: any;
    try {
        decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!);
    } catch (error: any) {
        return res.status(401).json({success: false, message: 'Invalid token or Expire token'});
    }


    // Chek if the user session exists in Redis
    const sessionExists = await redisClient.get(`session:${decoded.userId}:${decoded.sessionId}`);

    // If User session not exists 
    if(!sessionExists){

        // Both accessToken and refreshToken clear from cookies
        res.clearCookie('accessToken', {httpOnly: true, secure: true, sameSite: 'none'});
        res.clearCookie('refreshToken', {httpOnly: true, secure: true, sameSite: 'none'});

        // This response for user have not session
        return res.status(401).json({success: false, message: 'Session revoked. Please login again'});
    }

    // Attach decoded user info to request object
    (req as any).user = decoded;

    next();

    
} catch (error: any) {
    console.error('Auth middleware error', error);
    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
}
}