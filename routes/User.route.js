import express from "express";
import { authUser, registerUser, forgotPassword, verifyCode, resetPassword, changePassword, updateProfile, verifyEmail } from "../controllers/user.controller.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const UserRoute = express.Router();

UserRoute.post("/login", authUser);
UserRoute.post("/register", registerUser);
UserRoute.post("/forgot-password", forgotPassword);
UserRoute.post("/verify-code", verifyCode);
UserRoute.get("/verify-email/:token", verifyEmail);
UserRoute.post("/reset-password", resetPassword);
UserRoute.post("/change-password", changePassword);
UserRoute.put("/update-profile", protect, updateProfile);

export default UserRoute;
