import { Request, Response, NextFunction } from 'express';
import UserModel, { Iuser } from '../models/userModel';
import ErrorHandler from '../uitils/errorHandler';
import { bigPromise } from '../uitils/bigPromise';
import { getOtp, isBlankField } from '../uitils/helpers';
import jwt, { Secret } from 'jsonwebtoken';
import sendEmail from '../uitils/sendEmail';
import { createCokies } from '../uitils/session';
import { redis } from '../db/redis';
import { getAllUsersService, getUserById } from '../services/userService';
import bcrypt from 'bcryptjs';
import cloudinary from 'cloudinary'
import userModel from '../models/userModel';

interface IRegistratioBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registerUser = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await UserModel.findOne({ email: email });
        if (existingUser) { return next(new ErrorHandler("User Already Registered", 400)); }
        const user: IRegistratioBody = { name, email, password };
        const activationToken = createActivationToken(user);
        const activationCode: string = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        try {
            const mailOptions = { email: user.email, subject: "LMS Account Activation", template: "activationEmail.ejs", data: data };
            await sendEmail(mailOptions);
            res.status(200).json({ success: true, msg: `We have sent you an email to ${user.email} please check it to verify your account.`, activationToken: activationToken.token })
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IActivationToken {
    token: string;
    activationCode: string;
}

const createActivationToken = (user: any): IActivationToken => {
    const activationCode = getOtp();
    const token = jwt.sign({ user, activationCode }, process.env.ACESSTOKENPRIVATEKEY as Secret, { expiresIn: '5m' });
    return { token, activationCode };
}

interface IActivationReq {
    activationToken: string;
    activationCode: string;
}

export const activateUser = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activationToken, activationCode } = req.body as IActivationReq;
        const newUser: { user: Iuser; activationCode: string } = jwt.verify(activationToken, process.env.ACESSTOKENPRIVATEKEY as string) as { user: Iuser, activationCode: string };
        if (newUser.activationCode != activationCode) {
            return next(new ErrorHandler("Invalid OTP", 401));
        }
        const { name, email, password } = newUser.user;
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return next(new ErrorHandler("User Already Registered", 401));
        }
        const user = await UserModel.create({ name, email, password, isVerified: true });
        res.status(200).send({ success: true });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IloginRequest {
    email: string;
    password: string;
}

export const loginUser = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body as IloginRequest;
        if (isBlankField(email) || isBlankField(password)) {
            return next(new ErrorHandler("Plese enter email and password", 400));
        }

        const user = await UserModel.findOne({ email: email }).select("+password");
        if (!user) {
            return next(new ErrorHandler("Invalid Credentials", 400));
        }

        const comparePassword = await user.comparePassword(password);
        if (!comparePassword) {
            return next(new ErrorHandler("Invalid Credentials", 400));
        }

        createCokies(user, 200, res);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const logoutUser = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.clearCookie("access_token");
        res.clearCookie("refresh_token");
        redis.del(req.user?._id)
        res.status(200).json({ success: true, msg: "User loggedout successfullt" });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getUserInfo = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getUserById(req.user?._id, res, req);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface ISocialAuthBody {
    email: string;
    name: string;
    avatar: string;
}

export const socialAuth = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, avatar } = req.body as ISocialAuthBody;
        const user = await UserModel.findOne({ email: email })
        if (!user) {
            const newUser = await UserModel.create({ email: email, name: name, avatar: avatar });
            createCokies(newUser, 200, res);
        } else {
            createCokies(user, 200, res);
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IUserUpdate {
    email?: string;
    name?: string;
    avatar?: string;
}

export const updateUser = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, avatar } = req.body as IUserUpdate;
        const userId = req.user?._id;
        const user = await UserModel.findById(userId);
        if (email && user) {
            const emailExists = await UserModel.findOne({ email: email });
            if (emailExists) {
                return next(new ErrorHandler("This user with this email already exists", 400));
            }
            user.email = email;
        }

        if (name && user) {
            user.name = name;
        }

        if (avatar && user) {
            if (user?.avatar?.public_id) {
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
                const uploadImage = await cloudinary.v2.uploader.upload(avatar, { folder: "avatar", });
                user.avatar = { public_id: uploadImage.public_id, url: uploadImage.secure_url }
            }
        }
        await user?.save();
        await redis.set(`loggedinuser:${user?._id}`, JSON.stringify(user));
        res.status(200).json({ sucess: true, user });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IUpdatePassword {
    password: string
    confirmPassword: string
    oldPassword: string
}

export const updatePassword = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { password, confirmPassword, oldPassword } = req.body as IUpdatePassword;
        const userId = req.user?._id;
        if (!password || !confirmPassword) { return next(new ErrorHandler("Password cnd confirm are required", 403)); }
        const hasedConfirmPassword = await bcrypt.hash(confirmPassword, 10);
        const isMatchPassword = await bcrypt.compare(password, hasedConfirmPassword);
        if (!isMatchPassword) { return next(new ErrorHandler("Password and confirm password dose not match", 403)); }
        const user = await UserModel.findById(userId).select("+password");
        if (!user?.password) { return next(new ErrorHandler("Invalid request", 403)); }
        const isOldPassCorrect = await user?.comparePassword(oldPassword);
        if (!isOldPassCorrect) { return next(new ErrorHandler("Incorrect old password", 403)); }
        const previousPassword = await user?.comparePassword(password);
        if (previousPassword) { return next(new ErrorHandler("New password can not be same as old password", 403)); }
        user.password = password;
        await user?.save();
        await redis.set(userId, JSON.stringify(user));
        res.status(200).json({ success: true, user });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getAllUsers = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllUsersService(res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});