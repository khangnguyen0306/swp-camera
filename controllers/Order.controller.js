import asyncHandler from 'express-async-handler';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API quản lý đơn hàng
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới từ giỏ hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - customerInfo
 *               - pickupTime
 *             properties:
 *               customerId:
 *                 type: string
 *                 description: ID của khách hàng
 *                 example: "60f0a9c1a6b7c3001f123456"
 *               customerInfo:
 *                 type: object
 *                 required:
 *                   - fullName
 *                   - phone
 *                   - email
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     description: Họ tên khách hàng
 *                     example: "Nguyễn Văn A"
 *                   phone:
 *                     type: string
 *                     description: Số điện thoại
 *                     example: "0123456789"
 *                   email:
 *                     type: string
 *                     description: Email
 *                     example: "nguyenvana@example.com"
 *               pickupTime:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian nhận hàng
 *                 example: "2024-03-20T10:00:00Z"
 *               note:
 *                 type: string
 *                 description: Ghi chú đơn hàng
 *                 example: "Giao hàng vào buổi sáng"
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Tạo đơn hàng thành công"
 *       404:
 *         description: Không tìm thấy giỏ hàng
 *       500:
 *         description: Lỗi server
 */

// Create new order from cart
export const createOrder = asyncHandler(async (req, res) => {
    const { customerId, pickupTime, note } = req.body;
    
    // Get customer's cart
    const cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
        res.status(404);
        throw new Error('Cart not found');
    }

    // Create order items from cart items
    const orderItems = cart.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
    }));
    console.log(req.body)

    // Create new order
    const order = new Order({
        customer: customerId,
        items: orderItems,
        totalAmount: cart.totalPrice,
        customerInfo: req.body.customerInfo,
        pickupTime,
        note
    });

    // Save order
    const savedOrder = await order.save();

    // Clear cart after successful order
    cart.items = [];
    cart.totalPrice = 0;
    cart.totalItems = 0;
    await cart.save();

    res.status(201).json({
        success: true,
        data: savedOrder,
        message: 'Tạo đơn hàng thành công'
    });
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số trang (mặc định là 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số lượng đơn hàng trên mỗi trang (mặc định là 10)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Lọc theo trạng thái đơn hàng
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 5
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách đơn hàng thành công"
 *       401:
 *         description: Không có quyền truy cập
 *       500:
 *         description: Lỗi server
 */

// Get all orders (for admin)
export const getAllOrders = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const filter = {};
    if (req.query.status) {
        filter.status = req.query.status;
    }

    const count = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
        .populate('customer', 'username email')
        .populate('items.product', 'name price')
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        success: true,
        data: orders,
        page,
        pages: Math.ceil(count / pageSize),
        total: count,
        message: 'Lấy danh sách đơn hàng thành công'
    });
});

/**
 * @swagger
 * /api/orders/customer/{customerId}:
 *   get:
 *     summary: Lấy đơn hàng của khách hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của khách hàng
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng của khách hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách đơn hàng thành công"
 *       500:
 *         description: Lỗi server
 */

// Get customer's orders
export const getCustomerOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer: req.params.customerId })
        .populate('items.product', 'name price');
    
    res.json({
        success: true,
        data: orders,
        message: 'Lấy danh sách đơn hàng thành công'
    });
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Lấy chi tiết đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Chi tiết đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Lấy chi tiết đơn hàng thành công"
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */

// Get single order
export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'username email')
        .populate('items.product', 'name price');
    
    if (!order) {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng');
    }
    
    res.json({
        success: true,
        data: order,
        message: 'Lấy chi tiết đơn hàng thành công'
    });
});

/**
 * @swagger
 * /api/orders/{id}/status:
 *   patch:
 *     summary: Cập nhật trạng thái đơn hàng (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled]
 *                 description: Trạng thái mới của đơn hàng
 *                 example: "confirmed"
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Cập nhật trạng thái đơn hàng thành công"
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */

// Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng');
    }

    order.status = status;
    const updatedOrder = await order.save();
    
    res.json({
        success: true,
        data: updatedOrder,
        message: 'Cập nhật trạng thái đơn hàng thành công'
    });
});

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   patch:
 *     summary: Hủy đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Hủy đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *                   example: "Hủy đơn hàng thành công"
 *       400:
 *         description: Không thể hủy đơn hàng đã hoàn thành
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */

// Cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng');
    }

    if (order.status === 'completed') {
        res.status(400);
        throw new Error('Không thể hủy đơn hàng đã hoàn thành');
    }

    order.status = 'cancelled';
    const updatedOrder = await order.save();
    
    res.json({
        success: true,
        data: updatedOrder,
        message: 'Hủy đơn hàng thành công'
    });
}); 