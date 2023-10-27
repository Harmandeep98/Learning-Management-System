import express from 'express';
import { authRole, isAuthenticated } from '../middleware/auth';
import { createOrder, getAllOrders } from '../controllers/orderController';
import { roles } from '../constants';
var orderRouter = express.Router();

orderRouter.post("/order/purchase", isAuthenticated, createOrder);
orderRouter.get("/orders", isAuthenticated, authRole(roles.admin), getAllOrders);

export default orderRouter;
