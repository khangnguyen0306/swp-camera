import express from 'express';
import {
    createBrand,
    getBrands,
    getBrandById,
    updateBrand,
    deleteBrand
} from '../controllers/brand.controller.js';
import { protect, admin } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// Các route chỉ dành cho Admin quản lý Thương hiệu
router.route('/')
    .post(protect, admin, createBrand) 
    .get(getBrands); 

router.route('/:id')
    .get(getBrandById) 
    .put(protect, admin, updateBrand) 
    .delete(protect, admin, deleteBrand); 

export default router; 