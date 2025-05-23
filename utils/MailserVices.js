// mailService.js
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// 1. Tải biến môi trường
dotenv.config();

// 2. Tạo transporter
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: +process.env.MAIL_PORT,
  secure: process.env.MAIL_SECURE === 'true', 
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// 3. Kiểm tra kết nối (tuỳ chọn)
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

export default transporter;
