import type { Request, Response } from "express";
import { generateGeminiResponse } from "../services/geminiServices.js";


export async function handleAiPrompt(req: Request, res: Response){
    try {

        const {prompt} = req.body;

        if(!prompt){
            return res.status(400).json({
                success: false,
                message: 'Prompt is required'
            });
        }

       const result = await generateGeminiResponse(prompt);

       return res.status(200).json({success: true, result});
        
    } catch (error: any) {
        console.error('handleAiPrompt error', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}