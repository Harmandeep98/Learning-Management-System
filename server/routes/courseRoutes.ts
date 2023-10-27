import express from 'express';
import { authRole, isAuthenticated } from '../middleware/auth';
import { addCourseReview, addQuestion, addReviewReply, getAllCourse, getCourse, isBoughtCourse, replyQuestion, updateCourse, uploadCourse } from '../controllers/courseController';
import { createOrder } from '../controllers/orderController';
const courseRouter = express.Router();

courseRouter.post("/course/upload", isAuthenticated, authRole("admin"), uploadCourse);
courseRouter.put("/course/update/:id", isAuthenticated, authRole("admin"), updateCourse);
courseRouter.get("/course/:id", getCourse);
courseRouter.get("/courses", getAllCourse);
courseRouter.get("/course/enrolled/:id", isAuthenticated, isBoughtCourse);
courseRouter.put("/course/question/add", isAuthenticated, addQuestion);
courseRouter.put("/course/question/reply", isAuthenticated, replyQuestion);
courseRouter.post("/course/:id/reviews/add", isAuthenticated, addCourseReview);
courseRouter.put("/course/:id/reviews/reply/add", isAuthenticated, authRole("admin"), addReviewReply);

export default courseRouter;