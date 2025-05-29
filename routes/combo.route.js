import express from "express";
import { createCombo, getCombos, getComboById, updateCombo, deleteCombo } from "../controllers/combo.controller.js";
import { protect, admin } from "../middleware/authMiddleware.js";
const router = express.Router();

// Tạo combo (chỉ quản lý)
router.post("/", protect, admin, createCombo);
// Lấy danh sách combo
router.get("/", getCombos);
// Lấy chi tiết combo
router.get("/:id", getComboById);
// Sửa combo (chỉ quản lý)
router.put("/:id", protect, admin, updateCombo);
// Xóa combo (chỉ quản lý)
router.delete("/:id", protect, admin, deleteCombo);

export default router; 