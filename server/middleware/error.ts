import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../uitils/errorHandler";

export const ErrorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    if (err.name == "CastError") {
        const message = `Resource not found. Inavlid: ${err.path}`;
        err = new ErrorHandler(message, 400);
    } else if (err.code == 1100) {
        const message = `Duplicate ${Object.keys(err.keyValues)} found`;
        err = new ErrorHandler(message, 400);
    } else if (err.name == "JsonWebTokenError") {
        const message = `Invalid token please try again later`;
        err = new ErrorHandler(message, 400);
    } else if (err.name == "TokenExpiredError") {
        const message = `Session expired please login`
        err = new ErrorHandler(message, 400);
    }

    res.status(err.statusCode).json({ success: false, msg: err.message });
}