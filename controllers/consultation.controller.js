import ConsultationRequest from '../models/ConsultationRequest.model.js';
import asyncHandler from 'express-async-handler';

/**
 * @swagger
 * tags:
 *   name: Consultation
 *   description: API quản lý yêu cầu tư vấn
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: error
 *         message:
 *           type: string
 *           example: Không tìm thấy yêu cầu tư vấn
 *     Success:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: success
 *         message:
 *           type: string
 *           example: Tạo yêu cầu tư vấn thành công
 *         data:
 *           type: object
 *           $ref: '#/components/schemas/ConsultationRequest'
 *     ConsultationRequest:
 *       type: object
 *       required:
 *         - customerName
 *         - phoneNumber
 *         - consultationType
 *       properties:
 *         customerName:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           example: Nguyễn Văn A
 *         phoneNumber:
 *           type: string
 *           pattern: '^[0-9]{10,11}$'
 *           example: "0987654321"
 *         email:
 *           type: string
 *           format: email
 *           example: nguyenvana@email.com
 *         consultationType:
 *           type: string
 *           enum: [call_now, schedule]
 *           example: call_now
 *         preferredTime:
 *           type: string
 *           format: date-time
 *           example: "2024-03-20T10:00:00Z"
 *         status:
 *           type: string
 *           enum: [pending, scheduled, pending_reschedule, completed, cancelled]
 *           example: pending
 *           description: |
 *             Trạng thái của yêu cầu tư vấn:
 *             - pending: Đang chờ xử lý (cho yêu cầu gọi ngay)
 *             - scheduled: Đã lên lịch (cho yêu cầu hẹn trước)
 *             - pending_reschedule: Đang chờ đổi lịch (khi khách hàng yêu cầu đổi lịch)
 *             - completed: Đã hoàn thành (đã tư vấn thành công)
 *             - cancelled: Đã hủy (khách hàng từ chối hoặc không liên lạc được)
 *         callHistory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CallHistory'
 *         notes:
 *           type: string
 *           example: Khách hàng quan tâm đến camera an ninh
 *     CallHistory:
 *       type: object
 *       required:
 *         - callTime
 *         - result
 *         - callerInfo
 *       properties:
 *         callTime:
 *           type: string
 *           format: date-time
 *           example: "2024-03-20T10:00:00Z"
 *         result:
 *           type: string
 *           enum: [success, rescheduled, rejected, no_answer]
 *           example: success
 *         notes:
 *           type: string
 *           example: Đã xác nhận lịch hẹn
 *         callerInfo:
 *           type: object
 *           required:
 *             - userId
 *             - name
 *           properties:
 *             userId:
 *               type: string
 *               example: "507f1f77bcf86cd799439011"
 *             name:
 *               type: string
 *               example: "Manager A"
 */

/**
 * @swagger
 * /api/consultations/requests:
 *   post:
 *     summary: Tạo yêu cầu tư vấn mới
 *     tags: [Consultation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - phoneNumber
 *               - consultationType
 *             properties:
 *               customerName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^[0-9]{10,11}$'
 *               email:
 *                 type: string
 *                 format: email
 *               consultationType:
 *                 type: string
 *                 enum: [call_now, schedule]
 *               preferredTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Tạo yêu cầu thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @desc    Tạo yêu cầu tư vấn mới
// @route   POST /api/consultations/requests
// @access  Public
const createRequest = asyncHandler(async (req, res) => {
  const {
    customerName,
    phoneNumber,
    email,
    consultationType,
    preferredTime
  } = req.body;

  // Validate input
  if (!customerName || customerName.length < 2 || customerName.length > 100) {
    res.status(400);
    throw new Error('Tên khách hàng phải từ 2-100 ký tự');
  }

  if (!phoneNumber || !/^[0-9]{10,11}$/.test(phoneNumber)) {
    res.status(400);
    throw new Error('Số điện thoại không hợp lệ');
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error('Email không hợp lệ');
  }

  if (!consultationType || !['call_now', 'schedule'].includes(consultationType)) {
    res.status(400);
    throw new Error('Loại tư vấn không hợp lệ');
  }

  if (consultationType === 'schedule' && !preferredTime) {
    res.status(400);
    throw new Error('Vui lòng chọn thời gian tư vấn');
  }

  const consultationRequest = new ConsultationRequest({
    customerName,
    phoneNumber,
    email,
    consultationType,
    preferredTime: consultationType === 'call_now' ? new Date() : new Date(preferredTime),
    status: consultationType === 'call_now' ? 'pending' : 'scheduled'
  });

  await consultationRequest.save();

  res.status(201).json({
    status: 'success',
    message: 'Tạo yêu cầu tư vấn thành công',
    data: consultationRequest
  });
});

/**
 * @swagger
 * /api/consultations/requests:
 *   get:
 *     summary: Lấy danh sách yêu cầu tư vấn
 *     tags: [Consultation]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lọc theo trạng thái (có thể dùng dấu phẩy để phân tách nhiều trạng thái)
 *         example: "scheduled,pending_reschedule"
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu tư vấn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Lấy danh sách yêu cầu tư vấn thành công
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ConsultationRequest'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @desc    Lấy danh sách yêu cầu tư vấn
// @route   GET /api/consultations/requests
// @access  Private/Admin
const getRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  
  // Nếu có status trong query thì lọc theo status đó
  if (status) {
    filter.status = { $in: status.split(',') };
  }

  const requests = await ConsultationRequest.find(filter)
    .sort({ preferredTime: -1 }) // Sắp xếp theo thời gian mới nhất
    .exec();

  res.json({
    status: 'success',
    message: 'Lấy danh sách yêu cầu tư vấn thành công',
    data: requests
  });
});

/**
 * @swagger
 * /api/consultations/requests/{id}/reschedule:
 *   put:
 *     summary: Cập nhật lịch hẹn tư vấn
 *     tags: [Consultation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của yêu cầu tư vấn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPreferredTime
 *               - callerId
 *               - callerName
 *             properties:
 *               newPreferredTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-21T10:00:00Z"
 *               notes:
 *                 type: string
 *                 example: "Khách hàng yêu cầu đổi lịch"
 *               callerId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               callerName:
 *                 type: string
 *                 example: "Manager A"
 *     responses:
 *       200:
 *         description: Cập nhật lịch hẹn thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy yêu cầu tư vấn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @desc    Cập nhật lịch hẹn tư vấn
// @route   PUT /api/consultations/requests/:id/reschedule
// @access  Private/Admin
const rescheduleRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPreferredTime, notes, callerId, callerName } = req.body;


  // Validate input
  if (!newPreferredTime || !Date.parse(newPreferredTime)) {
    res.status(400);
    throw new Error('Thời gian hẹn không hợp lệ');
  }

  if (!callerId || !callerName) {
    res.status(400);
    throw new Error('Thông tin người gọi không đầy đủ');
  }

  const request = await ConsultationRequest.findById(id);
  if (!request) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu tư vấn');
  }

  // Add to call history
  request.callHistory.push({
    callTime: new Date(),
    result: 'rescheduled',
    notes,
    callerInfo: {
      userId: callerId,
      name: callerName
    }
  });

  // Update preferred time and status
  request.preferredTime = new Date(newPreferredTime);
  request.status = 'scheduled';

  await request.save();

  res.json({
    status: 'success',
    message: 'Cập nhật lịch hẹn thành công',
    data: request
  });
});

/**
 * @swagger
 * /api/consultations/requests/{id}/call-result:
 *   put:
 *     summary: Cập nhật kết quả cuộc gọi
 *     tags: [Consultation]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của yêu cầu tư vấn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - result
 *               - callerId
 *               - callerName
 *             properties:
 *               result:
 *                 type: string
 *                 enum: [success, rescheduled, rejected, no_answer]
 *                 example: success
 *               notes:
 *                 type: string
 *                 example: "Đã tư vấn thành công"
 *               callerId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *               callerName:
 *                 type: string
 *                 example: "Manager A"
 *     responses:
 *       200:
 *         description: Cập nhật kết quả cuộc gọi thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Không tìm thấy yêu cầu tư vấn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// @desc    Cập nhật kết quả cuộc gọi
// @route   PUT /api/consultations/requests/:id/call-result
// @access  Private/Admin
const updateCallResult = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { result, notes, callerId, callerName } = req.body;

  // Validate input
  if (!result || !['success', 'rescheduled', 'rejected', 'no_answer'].includes(result)) {
    res.status(400);
    throw new Error('Kết quả cuộc gọi không hợp lệ');
  }

  if (!callerId || !callerName) {
    res.status(400);
    throw new Error('Thông tin người gọi không đầy đủ');
  }

  const request = await ConsultationRequest.findById(id);
  if (!request) {
    res.status(404);
    throw new Error('Không tìm thấy yêu cầu tư vấn');
  }

  // Add to call history
  request.callHistory.push({
    callTime: new Date(),
    result,
    notes,
    callerInfo: {
      userId: callerId,
      name: callerName
    }
  });

  // Update status based on result
  if (result === 'success') {
    request.status = 'completed';
  } else if (result === 'rescheduled') {
    request.status = 'pending_reschedule';
  }

  await request.save();

  res.json({
    status: 'success',
    message: 'Cập nhật kết quả cuộc gọi thành công',
    data: request
  });
});

export {
  createRequest,
  getRequests,
  rescheduleRequest,
  updateCallResult
}; 