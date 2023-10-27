import express from 'express';
import { authRole, isAuthenticated } from '../middleware/auth';
import { getNotification, upadateNotification } from '../controllers/notificationsController';
import { roles } from '../constants';
var notificationRouter = express.Router();

notificationRouter.get("/notifications", isAuthenticated, authRole(roles.admin), getNotification);
notificationRouter.put("/notification/:id", isAuthenticated, authRole(roles.admin), upadateNotification);

export default notificationRouter;
