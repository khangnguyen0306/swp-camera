import asyncHandler from 'express-async-handler';
import Order from '../models/Order.model.js';
import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import Combo from '../models/Combo.model.js';

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API quản lý đơn hàng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: ID của sản phẩm
 *         quantity:
 *           type: number
 *           description: Số lượng sản phẩm
 *         price:
 *           type: number
 *           description: Giá sản phẩm tại thời điểm đặt hàng
 *         productName:
 *           type: string
 *           description: Tên sản phẩm
 *     CustomerInfo:
 *       type: object
 *       required:
 *         - username
 *         - email
 *       properties:
 *         username:
 *           type: string
 *           description: Tên người đặt hàng
 *         email:
 *           type: string
 *           description: Email người đặt hàng
 *         phone:
 *           type: string
 *           description: Số điện thoại
 *         address:
 *           type: string
 *           description: Địa chỉ giao hàng
 *     Payment:
 *       type: object
 *       properties:
 *         method:
 *           type: string
 *           enum: [cod, payos]
 *           description: Phương thức thanh toán
 *         status:
 *           type: string
 *           enum: [pending, completed, failed]
 *           description: Trạng thái thanh toán
 *         transactionId:
 *           type: string
 *           description: ID giao dịch thanh toán
 *         paymentTime:
 *           type: string
 *           format: date-time
 *           description: Thời gian thanh toán
 *         paymentDetails:
 *           type: object
 *           description: Chi tiết thanh toán
 *     Order:
 *       type: object
 *       required:
 *         - customer
 *         - items
 *         - totalAmount
 *         - customerInfo
 *         - pickupTime
 *       properties:
 *         customer:
 *           type: string
 *           description: ID của khách hàng
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         totalAmount:
 *           type: number
 *           description: Tổng tiền đơn hàng
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           description: Trạng thái đơn hàng
 *         customerInfo:
 *           $ref: '#/components/schemas/CustomerInfo'
 *         payment:
 *           $ref: '#/components/schemas/Payment'
 *         pickupTime:
 *           type: string
 *           format: date-time
 *           description: Thời gian nhận hàng
 *         note:
 *           type: string
 *           description: Ghi chú đơn hàng
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Tạo đơn hàng mới từ giỏ hàng hoặc mua combo
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
 *               customerInfo:
 *                 $ref: '#/components/schemas/CustomerInfo'
 *               pickupTime:
 *                 type: string
 *                 format: date-time
 *                 description: Thời gian nhận hàng
 *               note:
 *                 type: string
 *                 description: Ghi chú đơn hàng
 *               comboId:
 *                 type: string
 *                 description: ID của combo (nếu mua combo, nếu không thì tạo từ cart)
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
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       404:
 *         description: Không tìm thấy giỏ hàng hoặc combo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Lỗi server
 */

// Create new order from cart or combo
export const createOrder = asyncHandler(async (req, res) => {
    const { customerId, pickupTime, note, comboId, customerInfo } = req.body;

    // Generate short orderCode (format: random 8 digits)
    const orderCode = Math.floor(10000000 + Math.random() * 90000000);

    if (comboId) {
        // Đặt hàng combo
        const combo = await Combo.findById(comboId).populate('products');
        if (!combo) {
            return res.status(404).json({ success: false, message: 'Combo không tồn tại' });
        }
        // Tạo order items từ các sản phẩm trong combo
        const orderItems = combo.products.map(product => ({
            product: product._id,
            quantity: 1,
            price: product.price,
            name: product.name
        }));
        const order = new Order({
            orderCode,
            customer: customerId,
            combo: comboId,
            items: orderItems,
            totalAmount: combo.price,
            customerInfo,
            pickupTime,
            note
        });
        const savedOrder = await order.save();
        return res.status(201).json({
            success: true,
            data: savedOrder,
            message: 'Tạo đơn hàng combo thành công'
        });
    }

    // Get customer's cart
    const cart = await Cart.findOne({ customer: customerId });
    if (!cart) {
        res.status(404);
        throw new Error('Cart not found');
    }

    // Get all product details for cart items
    const productIds = cart.items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    // Create a map of product details for quick lookup
    const productMap = products.reduce((map, product) => {
        map[product._id.toString()] = product;
        return map;
    }, {});

    // Create order items with product details
    const orderItems = cart.items.map(item => {
        const product = productMap[item.product.toString()];
        if (!product) {
            throw new Error(`Product not found: ${item.product}`);
        }
        return {
            product: item.product,
            quantity: item.quantity,
            price: item.price,
            name: product.name
        };
    });

    // Create new order
    const order = new Order({
        orderCode,
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 message:
 *                   type: string
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
        .populate({
            path: 'items.product',
            select: 'name price images'
        })
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       500:
 *         description: Lỗi server
 */

// Get customer's orders
export const getCustomerOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customer: req.params.customerId })
        .populate({
            path: 'items.product',
            select: 'name price images'
        });
    
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
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */

// Get single order
export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'username email')
        .populate({
            path: 'items.product',
            select: 'name price images'
        });
    
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
 *                 enum: [pending, processing, accepted, deliverying, completed, cancelled]
 *                 description: Trạng thái mới của đơn hàng
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
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */

// Update order status (Admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
        res.status(404);
        throw new Error('Không tìm thấy đơn hàng');
    }

    // Validate status transition
    const validTransitions = {
        'pending': ['processing', 'cancelled'],
        'processing': ['accepted', 'cancelled'],
        'accepted': ['deliverying', 'cancelled'],
        'deliverying': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
        res.status(400);
        throw new Error(`Không thể chuyển trạng thái từ ${order.status} sang ${status}`);
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
 * /api/orders/status/{status}:
 *   get:
 *     summary: Lấy danh sách đơn hàng theo trạng thái (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, processing, accepted, deliverying, completed, cancelled]
 *         description: Trạng thái đơn hàng cần lấy
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
 *     responses:
 *       200:
 *         description: Danh sách đơn hàng theo trạng thái
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Lỗi server
 */

// Get orders by status (Admin)
export const getOrdersByStatus = asyncHandler(async (req, res) => {
    const { status } = req.params;
    const pageSize = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const count = await Order.countDocuments({ status });
    const orders = await Order.find({ status })
        .populate('customer', 'username email')
        .populate({
            path: 'items.product',
            select: 'name price images'
        })
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
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
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