import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });


const chat = ai.chats.create({
  model: 'gemini-3.5-flash',  
});

export const generateGeminiResponse = async (prompt: string) => {
  try {

    const response = await chat.sendMessage({
      message: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error('Gemini Service Error:', error);
    throw new Error('AI generation failed');
  }
};