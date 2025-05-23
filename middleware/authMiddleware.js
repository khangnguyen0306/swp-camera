import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import Auth from '../models/Auth.model.js'; // Import model người dùng

// Middleware để bảo vệ các route riêng tư
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Kiểm tra xem token có trong header Authorization không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Xác minh token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm người dùng dựa trên ID trong token và loại trừ mật khẩu
      req.user = await Auth.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Không tìm thấy người dùng');
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Token không hợp lệ, không có quyền truy cập');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Không có token, không có quyền truy cập');
  }
});

// Middleware để chỉ cho phép Admin truy cập
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Chỉ Admin mới có quyền truy cập');
  }
};

export { protect, admin };