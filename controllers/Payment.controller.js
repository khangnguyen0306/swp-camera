import asyncHandler from 'express-async-handler';
import Order from '../models/Order.model.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import PayOS from "@payos/node";

// Load environment variables
dotenv.config();

// Initialize PayOS client
const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// Set timezone
process.env.TZ = 'Asia/Ho_Chi_Minh';

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             paymentUrl:
 *               type: string
 *               example: "https://checkout.payos.vn/..."
 *         message:
 *           type: string
 *           example: "Tạo URL thanh toán thành công"
 */

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: API quản lý thanh toán
 */

/**
 * @swagger
 * /api/payments/payos/create:
 *   post:
 *     summary: Tạo URL thanh toán PayOS
 *     description: Tạo URL thanh toán PayOS cho đơn hàng và chuyển hướng người dùng đến trang thanh toán
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: ID của đơn hàng cần thanh toán
 *                 example: "60f0a9c1a6b7c3001f123456"
 *     responses:
 *       200:
 *         description: Tạo URL thanh toán thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentResponse'
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy đơn hàng
 *       500:
 *         description: Lỗi server
 */
export const createPayOSPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Create payment data for PayOS
    const body = {
        orderCode: order.orderCode,
        amount: Math.round(order.totalAmount),
        description: `Don ${order.orderCode}`,
        items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
        })),
        cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
        returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
        buyerName: order.customerInfo.username,
        buyerEmail: order.customerInfo.email,
        expiredAt: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };

    console.log('Payment Request Body:', body);

    try {
        // Create payment using PayOS SDK
        const paymentLinkRes = await payOS.createPaymentLink(body);
        
        console.log('PayOS Payment Response:', paymentLinkRes);

        // Update order with payment information
        order.payment = {
            method: 'payos',
            status: 'pending',
            transactionId: paymentLinkRes.paymentLinkId,
            paymentDetails: paymentLinkRes
        };
        await order.save();

        res.json({
            success: true,
            data: {
                paymentUrl: paymentLinkRes.checkoutUrl
            },
            message: 'Tạo URL thanh toán thành công'
        });
    } catch (error) {
        console.error('PayOS payment error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        // Update order with failed payment status
        order.payment = {
            method: 'payos',
            status: 'failed',
            paymentTime: new Date(),
            paymentDetails: {
                error: error.message,
                response: error.response?.data
            }
        };
        await order.save();

        res.status(500);
        throw new Error('Không thể tạo thanh toán PayOS: ' + (error.response?.data?.desc || error.message));
    }
});

/**
 * @swagger
 * /api/payments/payos/webhook:
 *   post:
 *     summary: Xử lý webhook từ PayOS
 *     description: Endpoint này được PayOS gọi sau khi người dùng hoàn tất thanh toán
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayOSWebhookRequest'
 *     responses:
 *       200:
 *         description: Xử lý webhook thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid signature"
 *       404:
 *         description: Không tìm thấy đơn hàng
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Order not found"
 *       500:
 *         description: Lỗi server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
export const handlePayOSWebhook = asyncHandler(async (req, res) => {
    try {
        // Verify webhook using PayOS SDK
        const webhookData = payOS.verifyPaymentWebhookData(req.body);
        
        if (!webhookData) {
            res.status(400);
            throw new Error('Invalid webhook data');
        }

        // Find and update order by orderCode
        const order = await Order.findOne({ orderCode: webhookData.orderCode });
        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Update payment status
        order.payment.status = webhookData.code === '00' ? 'completed' : 'failed';
        order.payment.paymentTime = new Date();
        order.payment.paymentDetails = webhookData;

        // Update order status if payment is successful
        if (webhookData.code === '00') {
            order.status = 'processing';
        }

        await order.save();

        res.json({ success: true });
    } catch (error) {
        console.error('PayOS webhook error:', error);
        res.status(500);
        throw new Error('Error processing webhook: ' + error.message);
    }
}); 