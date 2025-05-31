import express from 'express';
import { createPayOSPayment } from '../controllers/Payment.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import Order from '../models/Order.model.js';
import PayOS from "@payos/node";
import dotenv from 'dotenv';

dotenv.config();

// Initialize PayOS client
const payOS = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

const router = express.Router();

// PayOS routes
router.post('/payos/create', protect, createPayOSPayment);

// Webhook route with direct handling
router.post('/payos/webhook', (req, res) => {
    try {
        // Verify webhook using PayOS SDK
        const webhookData = payOS.verifyPaymentWebhookData(req.body);
        console.log('aaa', webhookData)
        
        if (!webhookData) {
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook data'
            });
        }

        // Find and update order by orderCode
        Order.findOne({ orderCode: webhookData.orderCode })
            .then(order => {
                if (!order) {
                    return res.status(404).json({
                        success: false,
                        message: 'Order not found'
                    });
                }

                // Update payment status and order status based on payment result
                if (webhookData.code === '00') {
                    // Payment successful
                    order.payment.status = 'completed';
                    order.status = 'processing';
                } else {
                    // Payment failed
                    order.payment.status = 'failed';
                    order.status = 'pending';
                }
                console.log("bbbbb", order.status)

                // Store detailed payment information
                order.payment.paymentTime = new Date(webhookData.transactionDateTime);
                order.payment.transactionId = webhookData.reference;
                order.payment.paymentDetails = {
                    amount: webhookData.amount,
                    description: webhookData.description,
                    reference: webhookData.reference,
                    transactionDateTime: webhookData.transactionDateTime,
                    accountNumber: webhookData.accountNumber,
                    counterAccountName: webhookData.counterAccountName,
                    counterAccountNumber: webhookData.counterAccountNumber,
                    counterAccountBankId: webhookData.counterAccountBankId,
                    currency: webhookData.currency,
                    paymentLinkId: webhookData.paymentLinkId,
                    code: webhookData.code,
                    desc: webhookData.desc
                };

                return order.save();
            })
            .then(() => {
                res.json({ success: true });
            })
            .catch(error => {
                console.error('PayOS webhook error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Error processing webhook: ' + error.message
                });
            });
    } catch (error) {
        console.error('PayOS webhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing webhook: ' + error.message
        });
    }
});

export default router; 