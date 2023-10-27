import { Request, Response } from "express";

export const getUserById = async (id: string, res: Response, req: Request) => {
    res.status(200).json({ user: req.user });
}