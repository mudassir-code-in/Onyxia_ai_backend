import type { Request, Response } from "express";
import { generateAiResponse } from "../services/llm.service.js";


export async function handleAiPrompt(req: Request, res: Response){
    try {

        const decoded = (req as any).user;
        const sessionId = decoded.sessionId;
        const {message} = req.body;

        if(!message){
            return res.status(400).json({
                success: false,
                prompt: 'Prompt is required'
            });
        }

       const result = await generateAiResponse(message, sessionId);

       return res.status(200).json({success: true, result});
        
    } catch (error: any) {
        console.error('handleAiPrompt error', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}