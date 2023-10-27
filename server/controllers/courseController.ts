import { Response, Request, NextFunction } from "express";
import { bigPromise } from "../uitils/bigPromise";
import ErrorHandler from "../uitils/errorHandler";
import cloudinary from 'cloudinary';
import { createCourse } from "../services/courseService";
import courseModel from "../models/courseModel";
import { redis } from "../db/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendEmail from "../uitils/sendEmail";
import notificationModel from "../models/notificationModel";

export const uploadCourse = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const thumbnailUpload = await cloudinary.v2.uploader.upload(thumbnail, { folders: "courses" });
            data.thumbnail = { public_id: thumbnailUpload.public_id, url: thumbnailUpload.secure_url }
        }
        createCourse(data, res, next);
    } catch (error: any) {
        console.log(error);
        return next(new ErrorHandler(error.message, 400));
    }
});

export const updateCourse = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const thumbnailDelete = await cloudinary.v2.uploader.destroy(thumbnail.public_id);
            const thumbnailUpload = await cloudinary.v2.uploader.upload(thumbnail, { folders: "courses" });
            data.thumbnail = { public_id: thumbnailUpload.public_id, url: thumbnailUpload.secure_url }
        }
        const courseId = req.params.id;
        const course = await courseModel.findByIdAndUpdate(courseId, { $set: data }, { new: true });
        res.status(200).json({ success: true, course });
    } catch (error: any) {
        console.log(error);
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getCourse = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        var course;
        const courseId = req.params.id;
        const cacheCourse = await redis.get(`courses:${courseId}`)
        if (!cacheCourse) {
            course = await courseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links");
            await redis.set(`courses:${courseId}`, JSON.stringify(course))
        } else { course = JSON.parse(cacheCourse); }
        if (!course) { return next(new ErrorHandler("Unable to find a course", 400)); };
        res.status(200).json({ success: true, course });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const getAllCourse = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        let allCourses;
        const allCachedCourses = await redis.get("allcourses");
        if (!allCachedCourses) {
            allCourses = await courseModel.find().select("-courseData.videoUrl -courseData.suggestions -courseData.questions -courseData.links");
            await redis.set("allcourses", JSON.stringify(allCourses));
        } else { allCourses = allCachedCourses }
        res.status(200).json({ success: true, courses: allCourses });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

export const isBoughtCourse = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const courseId = req.params.id
        const isCourseAssociatedToUser = userCourseList?.find((course: any) => course._id.toString() == courseId);
        if (!isCourseAssociatedToUser) { return next(new ErrorHandler("You are not authorized to access this course", 400)); }
        const course = await courseModel.findById(courseId);
        const content = course?.courseData;
        res.status(200).json({ success: true, content: content });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IAddQuestion {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId }: IAddQuestion = req.body;
        const userCourseList = req.user?.courses;
        const isCourseAssociatedToUser = userCourseList?.find((course: any) => course._id.toString() == courseId);
        if (!isCourseAssociatedToUser) { return next(new ErrorHandler("You are not authorized to access this course", 400)); }
        const course = await courseModel.findById(courseId).populate({ path: "courseData.questions", populate: "user" }).populate({ path: "courseData.questions.questionRelies", populate: "user" }).exec();
        if (!course) { return next(new ErrorHandler("Course not available", 400)); }
        if (!mongoose.Types.ObjectId.isValid(contentId)) { return next(new ErrorHandler("Invalid content id", 400)); }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));
        if (!courseContent) { return next(new ErrorHandler("Invalid content id", 400)); }
        const newQuestion: any = { user: req.user?._id, question: question, questionRelies: [] }
        courseContent.questions.push(newQuestion);
        await notificationModel.create({
            userId: req.user!._id,
            title: 'New question',
            message: `You have question about ${question} in ${courseContent.title}`,
        })
        let updatedCourse = await course.save();
        res.status(200).json({ success: true, course: updatedCourse });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface IAddAnswerData {
    reply: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const replyQuestion = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, contentId, reply, questionId }: IAddAnswerData = req.body;
        const userCourseList = req.user?.courses;
        const isCourseAssociatedToUser = userCourseList?.find((course: any) => course._id.toString() == courseId);
        if (!isCourseAssociatedToUser) { return next(new ErrorHandler("You are not authorized to access this course", 400)); }
        const course = await courseModel.findById(courseId).populate({ path: "courseData.questions", populate: "user" }).populate({ path: "courseData.questions.questionRelies", populate: "user" }).exec();
        if (!course) { return next(new ErrorHandler("Course not found", 400)); }
        if (!mongoose.Types.ObjectId.isValid(contentId)) { return next(new ErrorHandler("Invalid content id", 400)); }
        if (!mongoose.Types.ObjectId.isValid(questionId)) { return next(new ErrorHandler("Invalid question id", 400)); }
        const courseContent = course?.courseData?.find((item: any) => item._id.equals(contentId));
        if (!courseContent) { return next(new ErrorHandler("Content not found", 400)); }
        const question = courseContent?.questions?.find((item: any) => item._id.equals(questionId));
        if (!question) { return next(new ErrorHandler("Question not found", 400)); }
        const newAnswer: any = { user: req.user?._id, reply }
        question.questionRelies?.push(newAnswer);
        const updatedCourse = await course.save();
        if (req.user?._id == question.user._id) {
            await notificationModel.create({
                userId: req.user._id,
                title: 'Reply to Question',
                message: `Someone replied in question ${question.question} that ${newAnswer.reply}.`,
            })
        } else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
                visit: process.env.ORIGINURL
            }
            try {
                const mailOptions = { email: req.user!.email, subject: "LMS Question Reply", template: "question-reply.ejs", data: data };
                await sendEmail(mailOptions);
            } catch (error: any) {
                return next(new ErrorHandler(error.message, error.code));
            }
        }
        res.status(200).json({ success: true, course: updatedCourse });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});

interface IAddReviewData {
    review: string;
    rating: number;
}

export const addCourseReview = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCourseList = req.user?.courses;
        const { review, rating } = req.body as IAddReviewData;
        const courseId = req.params.id;
        const isCourseAssociatedToUser = userCourseList?.find((course: any) => course._id.toString() == courseId);
        if (!isCourseAssociatedToUser) { return next(new ErrorHandler("You are not authorized to access this course", 400)); }
        const course = await courseModel.findById(courseId);
        const reviewObj: any = { comment: review, rating: rating };
        course?.reviews.push(reviewObj);
        let avg = 0;
        course?.reviews.forEach((review) => {
            avg = avg + review.rating;
        });
        course!.ratings = avg / course!.reviews.length;
        await course?.save();
        const notification = { userId: req.user!._id, title: "New Review Recived", message: `${req.user!.name} has added new review to ${course!.name} that ${reviewObj.comment} with rating of ${reviewObj.rating}` }
        await notificationModel.create(notification);
        res.status(200).json({ success: true, course });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});

interface IAddReviewReply {
    reply: string;
    reviewId: string;
}

export const addReviewReply = bigPromise(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { reviewId, reply } = req.body as IAddReviewReply;
        const courseId = req.params.id;
        const course = await courseModel.findById(courseId);
        if (!course) { return next(new ErrorHandler("Course not found", 400)) }
        const foundReview = course?.reviews?.find((review: any) => review._id.toString() == reviewId);
        if (!foundReview) { return next(new ErrorHandler("Review not found", 400)) }
        if (foundReview && !foundReview?.replies) {
            foundReview!.replies = [{ user: req.user!._id, reply }];
        } else {
            foundReview!.replies.push({ user: req.user!._id, reply });
        }
        await course.save();
        res.status(200).json({ success: true, course })
    } catch (error: any) {
        return next(new ErrorHandler(error.message, error.code));
    }
});