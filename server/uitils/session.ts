import { Response } from 'express';
import { Iuser } from '../models/userModel';
import { redis } from '../db/redis';

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}

const accessTokenExpire = parseInt(process.env.ACESSTOKENEXPIRE || '300', 10);
const refreshTokenExpire = parseInt(process.env.REFRESHTOKENEXPIRE || '1200', 10);

export const accessTokenOption: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire * 60 * 1000),
    maxAge: accessTokenExpire * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
}
export const refreshTokenOption: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
}

export const createCokies = async (user: Iuser, statusCode: number, res: Response) => {
    const accessToken = await user.createAccessToken();
    const refreshToken = await user.createRefreshToken();
    try {
        redis.set(`loggedinuser:${user?._id}`, JSON.stringify(user));
    } catch (error) {
        console.error(error);
    }

    if (process.env.NODE_ENV !== 'prod') {
        accessTokenOption["secure"] = true;
    }
    res.cookie("access_token", accessToken, accessTokenOption);
    res.cookie("refresh_token", refreshToken, refreshTokenOption);
    res.status(statusCode).json({ success: true, user: user, accessToken });
}
