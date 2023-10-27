import express from 'express';
import { authRole, isAuthenticated } from '../middleware/auth';
import { getNotification, upadateNotification } from '../controllers/notificationsController';
var notificationRouter = express.Router();

notificationRouter.get("/notifications", isAuthenticated, authRole("admin"), getNotification);
notificationRouter.put("/notification/:id", isAuthenticated, authRole("admin"), upadateNotification);

export default notificationRouter;
