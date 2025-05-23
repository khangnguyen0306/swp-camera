import express from 'express';
import { authUser, registerUser, forgotPassword, verifyCode, resetPassword, changePassword } from '../controllers/user.controlller.js';

const UserRoute = express.Router();

UserRoute.post('/login', authUser);
UserRoute.post('/register', registerUser);
UserRoute.post('/forgot-password', forgotPassword);
UserRoute.post('/verify-code', verifyCode);
UserRoute.post('/reset-password', resetPassword);
UserRoute.post('/change-password', changePassword);

export default UserRoute; 