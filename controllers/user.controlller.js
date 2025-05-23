import asyncHandler from 'express-async-handler';
import Auth from '../models/Auth.model.js';
import generateToken from '../utils/GenerateToken.js';
import bcrypt from 'bcryptjs';
import transporter from '../utils/MailserVices.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  // Tìm user theo username hoặc phoneNumber
  const user = await Auth.findOne({
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail }
    ]
  });
  if (user && (await user.matchPassword(password))) {
    if (!user.isEmailVerified) {
      res.status(401);
      throw new Error('Email chưa được xác thực. Vui lòng kiểm tra email của bạn.');
    }
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id),
      }
    });
  } else {
    res.status(401);
    throw new Error('Sai tài khoản hoặc mật khẩu vui lòng thử lại !');
  }
});

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const userExists = await Auth.findOne({
    $or: [
      { username },
      { email }
    ]
  });
  if (userExists) {
    res.status(400);
    throw new Error('Tài khoản đã tồn tại');
  }

  // Tạo token xác thực email
  const emailVerificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const emailVerificationExpires = Date.now() + 3600000; // Token hết hạn sau 1 giờ

  const user = await Auth.create({
    username,
    email,
    passwordHash: password,
    isEmailVerified: false, 
    emailVerificationToken,
    emailVerificationExpires,
  });

  if (user) {
    // Gửi email xác thực
    const verificationUrl = `http://localhost:3000/verify-email/${emailVerificationToken}`; // chưa setting phía frontend

    const mailOptions = {
      to: email,
      subject: 'Xác thực địa chỉ email của bạn',
      text: `Chào ${username},\n\nVui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào liên kết này:\n${verificationUrl}\n\n` +
        `Liên kết này sẽ hết hạn sau 1 giờ.`,
      html: `<p>Chào ${username},</p><p>Vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào liên kết này:</p><p><a href="${verificationUrl}">Xác thực Email</a></p><p>Liên kết này sẽ hết hạn sau 1 giờ.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Lỗi gửi email xác thực:", error); // Log lỗi gửi email
        // Tuy nhiên, vẫn tiếp tục đăng ký người dùng thành công ở đây, 
        // có thể thêm logic để thử gửi lại email sau nếu cần.
      } else {
        console.log('Email xác thực đã gửi:', info.response);
      }
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified, // Vẫn trả về false
        token: generateToken(user._id),
      },
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
    });
  } else {
    res.status(400);
    throw new Error('Dữ liệu tài khoản không hợp lệ');
  }
});

// @desc    Forgot password
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await Auth.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy tài khoản');
  }

  // Tạo mã xác thực 6 số ngẫu nhiên
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu mã xác thực và thời gian hết hạn (1 phút)
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = Date.now() + 120000; // 2 phút
  await user.save();


  const mailOptions = {
    to: email,
    subject: 'Mã xác thực đặt lại mật khẩu',
    text: `Mã xác thực của bạn là: ${verificationCode}\n\n` +
      `Mã này sẽ hết hạn trong 1 phút. Vui lòng sử dụng nó để đặt lại mật khẩu của bạn.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).json({ message: 'Mã xác thực đã được gửi đến email của bạn' });
  });
});

// @desc    Verify code for password reset
// @route   POST /api/users/verify-code
// @access  Public
const verifyCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await Auth.findOne({ email });

  if (!user || user.verificationCode !== code || Date.now() > user.verificationCodeExpires) {
    res.status(400);
    throw new Error('Invalid or expired verification code');
  }

  res.status(200).json({ message: 'Verification code is valid' });
});

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, verificationCode } = req.body;
  const user = await Auth.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Kiểm tra mã xác thực và thời gian hết hạn
  if (user.verificationCode !== verificationCode || Date.now() > user.verificationCodeExpires) {
    res.status(400);
    throw new Error('Mã xác thực không hợp lệ hoặc đã hết hạn');
  }

  // Hash mật khẩu mới
  //   const salt = await bcrypt.genSalt(10);
  user.passwordHash = newPassword;

  // Xóa mã xác thực sau khi đặt lại mật khẩu
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;

  await user.save();

  res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công' });
});

// @desc    Change password
// @route   POST /api/users/change-password
// @access  Private (cần xác thực)
const changePassword = asyncHandler(async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  const user = await Auth.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy tài khoản');
  }

  // Kiểm tra mật khẩu cũ
  if (!(await user.matchPassword(oldPassword))) {
    res.status(401);
    throw new Error('Mật khẩu cũ không hợp lệ');
  }

  // Hash mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);

  await user.save();

  res.status(200).json({ message: 'Mật khẩu đã được thay đổi thành công' });
});

// @desc    Verify user email
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await Auth.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() }, 
  });

  if (!user) {
    res.status(400);
    throw new Error('Token xác thực không hợp lệ hoặc đã hết hạn');
  }

  // Cập nhật trạng thái xác thực và xóa token
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;

  await user.save();

  res.status(200).json({ message: 'Email của bạn đã được xác thực thành công!' });
});

export { authUser, registerUser, forgotPassword, verifyCode, resetPassword, changePassword, verifyEmail };


