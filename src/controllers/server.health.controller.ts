import type { Request, Response } from "express";

export function checkHealth(req: Request, res: Response){
    res.send('ok');
}