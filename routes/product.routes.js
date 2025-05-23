import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller.js';
import { protect,admin} from '../middleware/authMiddleware.js';



const router = express.Router();

// Public routes for products (anyone can view products)
router.route('/').get(getProducts);
router.route('/:id').get(getProductById);

// Protected routes (require authentication)
// Admin-only routes
router.route('/').post(protect, admin, createProduct); // Chỉ Admin mới có thể tạo sản phẩm
router.route('/:id').delete(protect, admin, deleteProduct); // Chỉ Admin mới có thể xóa sản phẩm

// Admin or Manager route for updating product
router.route('/:id').put(protect, updateProduct); // Admin hoặc Manager có thể cập nhật sản phẩm (logic phân quyền nằm trong controller)

export default router; 