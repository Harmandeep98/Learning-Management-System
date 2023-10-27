import { request } from "express";
import { Iuser } from "../models/userModel";

declare global {
    namespace Express {
        interface Request {
            user?: Iuser;
        }
    }
}