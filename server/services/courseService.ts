import { Response, Request, NextFunction } from "express";
import ErrorHandler from "../uitils/errorHandler";
import courseModel from "../models/courseModel";
import { bigPromise } from "../uitils/bigPromise";
import { redis } from '../db/redis';

export const createCourse = bigPromise(async (data: any, res: Response, next: NextFunction) => {
    try {
        const course = await courseModel.create(data);
        const redisCount = await redis.incr("totalcourse")
        res.status(200).json({ success: true, course });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getAllCoursesService = async (res: Response) => {
    let courses = await courseModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, courses: courses });
}