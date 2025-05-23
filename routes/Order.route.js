import express from 'express';
import { 
    createOrder, 
    getAllOrders, 
    getCustomerOrders, 
    getOrderById, 
    updateOrderStatus, 
    cancelOrder 
} from '../controllers/order.controller.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create new order
router.post('/', protect, createOrder);

// Get all orders (admin only)
router.get('/', protect, admin, getAllOrders);

// Get customer's orders
router.get('/customer/:customerId', protect, getCustomerOrders);

// Get single order
router.get('/:id', protect, getOrderById);

// Update order status (admin only)
router.patch('/:id/status', protect, admin, updateOrderStatus);

// Cancel order
router.patch('/:id/cancel', protect, cancelOrder);

export default router; 