import express from 'express';
import { activateUser, getUserInfo, loginUser, logoutUser, registerUser, socialAuth, updatePassword, updateUser } from '../controllers/userController';
import { UpdateAccessToken, authRole, isAuthenticated } from '../middleware/auth';
const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/user/verify", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refresh", UpdateAccessToken);
userRouter.get("/profile", isAuthenticated, getUserInfo);
userRouter.get("/socialauth", socialAuth);
userRouter.put("/user/update", isAuthenticated, updateUser);
userRouter.put("/user/update/password", isAuthenticated, updatePassword);
userRouter.get("/users", isAuthenticated, authRole("admin"), updatePassword);

export default userRouter;