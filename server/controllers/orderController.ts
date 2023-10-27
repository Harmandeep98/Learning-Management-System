import { Request, Response, NextFunction } from 'express';
import { bigPromise } from '../uitils/bigPromise';
import ErrorHandler from '../uitils/errorHandler';
import orderModel, { IOrder } from '../models/orderModel';
import courseModel from '../models/courseModel';
import sendEmail from '../uitils/sendEmail';
import notificationModel from '../models/notificationModel';
import userModel from '../models/userModel';
import { getAllOrdersService, newOrder } from '../services/orderService';

export const createOrder = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as IOrder;
        const user = await userModel.findById(req.user!._id);
        const alreadyPurchased = user?.courses.some((course: any) => course._id.toString() === courseId);
        if (alreadyPurchased) {
            return next(new ErrorHandler("Course already purchased", 400));
        }
        const course = await courseModel.findById(courseId);
        if (!course) {
            return next(new ErrorHandler("Course not found", 400));
        }
        const mailOption = {
            email: user!.email,
            subject: "Course purchase complete",
            template: "coursepurchase.ejs",
            data: { name: user!.name, order: { _id: course._id.toString().slice(0, 6), name: course.name, price: course.price, date: new Date().toLocaleDateString('en-us', { year: 'numeric', month: 'long', day: 'numeric' }) } }
        }
        try {
            await sendEmail(mailOption);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, error.code));
        }
        user!.courses.push(course._id);
        await user!.save();
        const notification = await notificationModel.create({
            title: 'New Course purchased',
            message: `${course.name} course have been purchased for ${course.price}`,
            userId: user?._id
        })
        course.purchased = + 1;
        await course.save();
        const data: any = { courseId: course._id, userId: user!._id, payment_info }
        newOrder(data, res, next);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});

export const getAllOrders = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        getAllOrdersService(res);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});