import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    toggleSelectItem
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các routes đều yêu cầu đăng nhập
router.use(protect);

router.route('/')
    .get(getCart)
    .post(addToCart)
    .delete(clearCart);

router.route('/:productId')
    .put(updateCartItem)
    .delete(removeFromCart);

router.route('/select/:productId')
    .put(toggleSelectItem);

export default router; 