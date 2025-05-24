import express from 'express';
import { 
    createPayOSPayment,
    handlePayOSWebhook
} from '../controllers/Payment.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// PayOS routes
router.post('/payos/create', protect, createPayOSPayment);
router.post('/payos/webhook', handlePayOSWebhook);

export default router; 