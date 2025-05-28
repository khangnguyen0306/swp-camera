import asyncHandler from "express-async-handler";
import Auth from "../models/Auth.model.js";
import generateToken from "../utils/GenerateToken.js";
import bcrypt from "bcryptjs";
import transporter from "../utils/MailserVices.js";
import { protect, admin } from "../middleware/authMiddleware.js";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API để quản lý người dùng và xác thực
 */

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Xác thực người dùng và lấy token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: Tên đăng nhập hoặc email của người dùng
 *               password:
 *                 type: string
 *                 description: Mật khẩu của người dùng
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                     token:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: ""
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu, hoặc Email chưa được xác thực
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Sai tài khoản hoặc mật khẩu vui lòng thử lại ! or Email chưa được xác thực. Vui lòng kiểm tra email của bạn."
 */
// @desc    Xác thực người dùng và lấy token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  // Tìm người dùng theo username hoặc email
  const user = await Auth.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (user && (await user.matchPassword(password))) {
    // Thêm kiểm tra xác thực email
    if (!user.isEmailVerified) {
      res.status(401);
      throw new Error("Email chưa được xác thực. Vui lòng kiểm tra email của bạn.");
    }
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        token: generateToken(user._id)
      },
      message: "Đăng nhập thành công"
    });
  } else {
    res.status(401);
    throw new Error("Sai tài khoản hoặc mật khẩu vui lòng thử lại !");
  }
});

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Đăng ký người dùng mới
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Tên đăng nhập
 *               email:
 *                 type: string
 *                 description: Địa chỉ email
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *     responses:
 *       201:
 *         description: Đăng ký thành công, email xác thực đã được gửi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     isEmailVerified:
 *                       type: boolean
 *                   description: Thông tin người dùng đã đăng ký (isEmailVerified sẽ là false)
 *                 message:
 *                   type: string
 *                   example: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
 *       400:
 *         description: Tài khoản đã tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tài khoản đã tồn tại or Dữ liệu tài khoản không hợp lệ"
 *       500:
 *         description: Lỗi gửi email xác thực (người dùng vẫn được tạo)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error sending verification email"
 */
// @desc    Đăng ký người dùng mới
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  const userExists = await Auth.findOne({
    $or: [{ username }, { email }]
  });
  if (userExists) {
    res.status(400);
    throw new Error("Tài khoản đã tồn tại");
  }

  // Tạo token xác thực email
  const emailVerificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

  const user = await Auth.create({
    username,
    email,
    passwordHash: password,
    firstName,
    lastName,
    isEmailVerified: false,
    emailVerificationToken
  });

  if (user) {
    // Gửi email xác thực
    const verificationUrl = `http://localhost:3000/verify-email/${emailVerificationToken}`; // chưa setting phía frontend

    const mailOptions = {
      to: email,
      subject: "Xác thực địa chỉ email của bạn",
      text: `Chào ${username},\n\nVui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào liên kết này:\n${verificationUrl}\n\n` + `Liên kết này sẽ hết hạn sau 1 giờ.`,
      html: `<p>Chào ${username},</p><p>Vui lòng xác thực địa chỉ email của bạn bằng cách nhấp vào liên kết này:</p><p><a href="${verificationUrl}">Xác thực Email</a></p><p>Liên kết này sẽ hết hạn sau 1 giờ.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Lỗi gửi email xác thực:", error); // Log lỗi gửi email
        // Tuy nhiên, vẫn tiếp tục đăng ký người dùng thành công ở đây,
        // có thể thêm logic để thử gửi lại email sau nếu cần.
      } else {
        console.log("Email xác thực đã gửi:", info.response);
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
        token: generateToken(user._id)
      },
      message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
    });
  } else {
    res.status(400);
    throw new Error("Dữ liệu tài khoản không hợp lệ");
  }
});

/**
 * @swagger
 * /api/users/forgot-password:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu (gửi mã xác thực qua email)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email của người dùng yêu cầu đặt lại mật khẩu
 *     responses:
 *       200:
 *         description: Mã xác thực đã được gửi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mã xác thực đã được gửi đến email của bạn"
 *       404:
 *         description: Không tìm thấy tài khoản với email đã cung cấp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy tài khoản"
 *       500:
 *         description: Lỗi khi gửi email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error sending email"
 */
// @desc    Quên mật khẩu
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await Auth.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy tài khoản");
  }

  // Tạo mã xác thực 6 số ngẫu nhiên
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu mã xác thực và thời gian hết hạn (1 phút)
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = Date.now() + 120000; // 2 phút
  await user.save();

  const mailOptions = {
    to: email,
    subject: "Mã xác thực đặt lại mật khẩu",
    text: `Mã xác thực của bạn là: ${verificationCode}\n\n` + `Mã này sẽ hết hạn trong 1 phút. Vui lòng sử dụng nó để đặt lại mật khẩu của bạn.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).json({ message: "Mã xác thực đã được gửi đến email của bạn" });
  });
});

/**
 * @swagger
 * /api/users/verify-code:
 *   post:
 *     summary: Xác thực mã để đặt lại mật khẩu
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email của người dùng
 *               code:
 *                 type: string
 *                 description: Mã xác thực nhận được qua email
 *     responses:
 *       200:
 *         description: Mã xác thực hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mã xác thực hợp lệ"
 *       400:
 *         description: Mã xác thực không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mã xác thực không hợp lệ hoặc đã hết hạn"
 */
// @desc    Xác thực mã để đặt lại mật khẩu
// @route   POST /api/users/verify-code
// @access  Public
const verifyCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const user = await Auth.findOne({ email });

  if (!user || user.verificationCode !== code || Date.now() > user.verificationCodeExpires) {
    res.status(400);
    throw new Error("Mã xác thực không hợp lệ hoặc đã hết hạn");
  }

  res.status(200).json({ message: "Mã xác thực hợp lệ" });
});

/**
 * @swagger
 * /api/users/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu mới sau khi xác thực mã
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - newPassword
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email của người dùng
 *               newPassword:
 *                 type: string
 *                 description: Mật khẩu mới
 *               verificationCode:
 *                 type: string
 *                 description: Mã xác thực đã nhận được và xác thực thành công
 *     responses:
 *       200:
 *         description: Mật khẩu đã được đặt lại thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mật khẩu đã được đặt lại thành công"
 *       400:
 *         description: Mã xác thực không hợp lệ hoặc đã hết hạn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mã xác thực không hợp lệ hoặc đã hết hạn"
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy người dùng"
 */
// @desc    Đặt lại mật khẩu
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, verificationCode } = req.body;
  const user = await Auth.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng");
  }

  // Kiểm tra mã xác thực và thời gian hết hạn
  if (user.verificationCode !== verificationCode || Date.now() > user.verificationCodeExpires) {
    res.status(400);
    throw new Error("Mã xác thực không hợp lệ hoặc đã hết hạn");
  }

  // Hash mật khẩu mới
  //   const salt = await bcrypt.genSalt(10);
  user.passwordHash = newPassword;

  // Xóa mã xác thực sau khi đặt lại mật khẩu
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;

  await user.save();

  res.status(200).json({ message: "Mật khẩu đã được đặt lại thành công" });
});

/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Đổi mật khẩu (yêu cầu xác thực)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email của người dùng
 *               oldPassword:
 *                 type: string
 *                 description: Mật khẩu cũ hiện tại
 *               newPassword:
 *                 type: string
 *                 description: Mật khẩu mới
 *     responses:
 *       200:
 *         description: Mật khẩu đã được thay đổi thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mật khẩu đã được thay đổi thành công"
 *       401:
 *         description: Mật khẩu cũ không hợp lệ hoặc không có quyền truy cập (token không hợp lệ/hết hạn)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Mật khẩu cũ không hợp lệ or Token không hợp lệ, không có quyền truy cập"
 *       403:
 *         description: Không có token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không có token, không có quyền truy cập"
 *       404:
 *         description: Không tìm thấy tài khoản
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy tài khoản"
 */
// @desc    Đổi mật khẩu
// @route   POST /api/users/change-password
// @access  Private (cần xác thực)
const changePassword = asyncHandler(async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;
  const user = await Auth.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy tài khoản");
  }

  // Kiểm tra mật khẩu cũ
  if (!(await user.matchPassword(oldPassword))) {
    res.status(401);
    throw new Error("Mật khẩu cũ không hợp lệ");
  }

  // Hash mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);

  await user.save();

  res.status(200).json({ message: "Mật khẩu đã được thay đổi thành công" });
});

/**
 * @swagger
 * /api/users/verify-email/{token}:
 *   get:
 *     summary: Xác thực địa chỉ email người dùng bằng token
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token xác thực email nhận được qua email
 *     responses:
 *       200:
 *         description: Email đã được xác thực thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email của bạn đã được xác thực thành công!"
 *       400:
 *         description: Token xác thực không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token xác thực không hợp lệ"
 */
// @desc    Xác thực email người dùng
// @route   GET /api/users/verify-email/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await Auth.findOne({
    emailVerificationToken: token
  });

  if (!user) {
    res.status(400);
    throw new Error("Token xác thực không hợp lệ");
  }

  if (user.isEmailVerified) {
    return res.status(409).json({
      success: false,
      errorCode: "EMAIL_ALREADY_VERIFIED",
      message: "Email đã được xác thực trước đó. Không thể xác thực lại."
    });
  }

  // Cập nhật trạng thái xác thực và xóa token
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;

  await user.save();

  res.status(200).json({ message: "Email của bạn đã được xác thực thành công!" });
});

/**
 * @swagger
 * /api/users/update-profile:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: newUsername
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *               firstName:
 *                 type: string
 *                 example: "Nguyen"
 *               lastName:
 *                 type: string
 *                 example: "Van A"
 *               address:
 *                 type: string
 *                 example: "123 Đường ABC, Quận 1, TP.HCM"
 *     responses:
 *       200:
 *         description: Cập nhật thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: "newUsername"
 *                     phone:
 *                       type: string
 *                       example: "0123456789"
 *                     firstName:
 *                       type: string
 *                       example: "Nguyen"
 *                     lastName:
 *                       type: string
 *                       example: "Van A"
 *                     address:
 *                       type: string
 *                       example: "123 Đường ABC, Quận 1, TP.HCM"
 *                 message:
 *                   type: string
 *                   example: "Cập nhật thông tin thành công"
 *       404:
 *         description: Không tìm thấy người dùng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy người dùng"
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const user = await Auth.findById(req.user._id);
  console.log("user", user);

  if (!user) {
    res.status(404);
    throw new Error("Không tìm thấy người dùng");
  }

  // Cập nhật thông tin người dùng
  user.username = username || user.username;
  user.phone = req.body.phone || user.phone;
  user.firstName = req.body.firstName || user.firstName;
  user.lastName = req.body.lastName || user.lastName;
  user.address = req.body.address || user.address;

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      username: user.username,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address
    },
    message: "Cập nhật thông tin thành công"
  });
});

export { authUser, registerUser, forgotPassword, verifyCode, resetPassword, changePassword, verifyEmail, updateProfile };
