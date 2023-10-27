import { NextFunction, Request, Response } from "express";
import { bigPromise } from "../uitils/bigPromise";
import ErrorHandler from "../uitils/errorHandler";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from "../db/redis";
import { accessTokenOption, refreshTokenOption } from "../uitils/session";

export const isAuthenticated = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.access_token;
    if (!accessToken) {
        return next(new ErrorHandler("Unauthorized Access", 401));
    }
    const decoded = jwt.verify(accessToken, process.env.ACESSTOKENPRIVATEKEY as string) as JwtPayload;
    if (!decoded) {
        return next(new ErrorHandler("Login Session Expired", 401));
    }
    const user = await redis.get(`loggedinuser:${decoded.id}`);
    if (!user) {
        return next(new ErrorHandler("Login Session Expired", 401));
    }
    req.user = JSON.parse(user);
    next()
});

export const authRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler("You are not authorized to access this resource", 401));
        }
        next();
    }
}

export const UpdateAccessToken = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refresh_token } = req.cookies;
        if (!refresh_token) {
            return next(new ErrorHandler("", 401));
        }
        const decoded = jwt.verify(refresh_token, process.env.REFRESHTOKENPRIVATEKEY as string) as JwtPayload
        const message = "could not refresh token";
        if (!decoded) {
            return next(new ErrorHandler(message, 401));
        }
        const session = await redis.get(decoded.id as string);
        if (!session) {
            return next(new ErrorHandler(message, 401));
        }
        const user = JSON.parse(session);
        const accessToken = jwt.sign({ id: user._id }, process.env.ACESSTOKENPRIVATEKEY as string, { expiresIn: '5m' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESHTOKENPRIVATEKEY as string, { expiresIn: '3d' });
        req.user = user;
        res.cookie("access_token", accessToken, accessTokenOption);
        res.cookie("refresh_token", refreshToken, refreshTokenOption);
        res.status(200).json({ success: true, accessToken });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});
