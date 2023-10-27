import { Request, Response } from "express";
import userModel from "../models/userModel";

export const getUserById = async (id: string, res: Response, req: Request) => {
    res.status(200).json({ user: req.user });
}

export const getAllUsersService = async (res: Response) => {
    let users = await userModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, users: users });
}