import express from 'express';
import { 
    createProductType, 
    getProductTypes, 
    getProductTypeById, 
    updateProductType, 
    deleteProductType 
} from '../controllers/productType.controller.js';
import { protect, admin } from '../middleware/authMiddleware.js'; // Giả định bạn có middleware xác thực

const router = express.Router();

// Các route chỉ dành cho Admin quản lý loại sản phẩm
router.route('/')
    .post(protect, admin, createProductType) // Tạo loại sản phẩm
    .get(getProductTypes); // Lấy tất cả loại sản phẩm (có thể công khai hoặc riêng tư tùy yêu cầu)

router.route('/:id')
    .get(getProductTypeById) // Lấy loại sản phẩm theo ID
    .put(protect, admin, updateProductType) // Cập nhật loại sản phẩm theo ID
    .delete(protect, admin, deleteProductType); // Xóa loại sản phẩm theo ID

export default router; 