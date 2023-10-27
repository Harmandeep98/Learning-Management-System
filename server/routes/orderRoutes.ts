import express from 'express';
import { isAuthenticated } from '../middleware/auth';
import { createOrder } from '../controllers/orderController';
var orderRouter = express.Router();

orderRouter.post("/order/purchase", isAuthenticated, createOrder);

export default orderRouter;
