import { NextFunction, Request, Response } from "express";
import { bigPromise } from "../uitils/bigPromise";
import orderModel from "../models/orderModel";


export const newOrder = bigPromise(async (data: any, res: Response, next: NextFunction) => {
    const order = await orderModel.create(data);
    console.log(JSON.stringify(order));
    res.status(200).json({ success: true, order })
    // next(order);
});