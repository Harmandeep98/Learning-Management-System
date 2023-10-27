import { Request, Response, NextFunction } from "express";
import notificationModel from "../models/notificationModel";
import { bigPromise } from "../uitils/bigPromise";
import ErrorHandler from "../uitils/errorHandler";
import cron from "node-cron";
import moment from "moment";

export const getNotification = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        let notifications = await notificationModel.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, notifications });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});

export const upadateNotification = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        await notificationModel.findByIdAndUpdate(req.params.id, { status: "read" });
        let notifications = await notificationModel.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, notifications });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});

// delete notification
cron.schedule("0 0 0 * * *", async function () {
    try {
        var before30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        var deleted = await notificationModel.deleteMany({ status: "read", createdAt: { $lt: before30Days } });
    } catch (error) {
        console.error(error);
    }
});