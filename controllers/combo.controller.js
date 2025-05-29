import Combo from "../models/Combo.model.js";
import asyncHandler from "express-async-handler";

/**
 * @swagger
 * tags:
 *   name: Combos
 *   description: API để quản lý và mua combo sản phẩm
 */

/**
 * @swagger
 * /api/combos:
 *   post:
 *     summary: Tạo combo mới (chỉ quản lý)
 *     tags: [Combos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - products
 *               - area
 *               - price
 *               - comboType
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên combo
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách ID sản phẩm
 *               area:
 *                 type: string
 *                 description: Diện tích sử dụng
 *               description:
 *                 type: string
 *                 description: Mô tả combo
 *               price:
 *                 type: number
 *                 description: Giá combo
 *               comboType:
 *                 type: string
 *                 enum: [basic, premium, family]
 *                 description: Loại combo
 *     responses:
 *       201:
 *         description: Tạo combo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Combo'
 *       401:
 *         description: Không có quyền truy cập
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 *   get:
 *     summary: Lấy danh sách combo (có thể filter theo loại combo, diện tích)
 *     tags: [Combos]
 *     parameters:
 *       - in: query
 *         name: comboType
 *         schema:
 *           type: string
 *           enum: [basic, premium, family]
 *         description: Lọc theo loại combo
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: Lọc theo diện tích sử dụng
 *     responses:
 *       200:
 *         description: Lấy danh sách combo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Combo'
 */

/**
 * @swagger
 * /api/combos/{id}:
 *   get:
 *     summary: Lấy chi tiết combo theo ID
 *     tags: [Combos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của combo
 *     responses:
 *       200:
 *         description: Lấy chi tiết combo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Combo'
 *       404:
 *         description: Không tìm thấy combo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *   put:
 *     summary: Cập nhật combo theo ID (chỉ quản lý)
 *     tags: [Combos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của combo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               area:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               comboType:
 *                 type: string
 *                 enum: [basic, premium, family]
 *     responses:
 *       200:
 *         description: Cập nhật combo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Combo'
 *       404:
 *         description: Không tìm thấy combo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *   delete:
 *     summary: Xóa combo theo ID (chỉ quản lý)
 *     tags: [Combos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của combo
 *     responses:
 *       200:
 *         description: Xóa combo thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 *       404:
 *         description: Không tìm thấy combo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 status:
 *                   type: integer
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Combo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         products:
 *           type: array
 *           items:
 *             type: object
 *         area:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         comboType:
 *           type: string
 *           enum: [basic, premium, family]
 *         createdBy:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Tạo combo (quản lý)
export const createCombo = asyncHandler(async (req, res) => {
  const { name, products, area, description, price, comboType } = req.body;
  const combo = await Combo.create({
    name, products, area, description, price, comboType, createdBy: req.user._id
  });
  res.status(201).json({
    success: true,
    status: 201,
    message: "Tạo combo thành công",
    data: combo
  });
});

// Lấy danh sách combo
export const getCombos = asyncHandler(async (req, res) => {
  const { comboType, area } = req.query;
  const filter = {};
  if (comboType) filter.comboType = comboType;
  if (area) filter.area = area;
  const combos = await Combo.find(filter).populate("products");
  res.status(200).json({
    success: true,
    status: 200,
    message: "Lấy danh sách combo thành công",
    data: combos
  });
});

// Lấy chi tiết combo
export const getComboById = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id).populate("products");
  if (!combo) return res.status(404).json({
    success: false,
    status: 404,
    message: "Không tìm thấy combo"
  });
  res.status(200).json({
    success: true,
    status: 200,
    message: "Lấy chi tiết combo thành công",
    data: combo
  });
});

// Sửa combo
export const updateCombo = asyncHandler(async (req, res) => {
  const { name, products, area, description, price, comboType } = req.body;
  const combo = await Combo.findById(req.params.id);
  if (!combo) {
    return res.status(404).json({ success: false, status: 404, message: "Không tìm thấy combo" });
  }
  combo.name = name ?? combo.name;
  combo.products = products ?? combo.products;
  combo.area = area ?? combo.area;
  combo.description = description ?? combo.description;
  combo.price = price ?? combo.price;
  combo.comboType = comboType ?? combo.comboType;
  await combo.save();
  res.status(200).json({ success: true, status: 200, message: "Cập nhật combo thành công", data: combo });
});

// Xóa combo
export const deleteCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  if (!combo) {
    return res.status(404).json({ success: false, status: 404, message: "Không tìm thấy combo" });
  }
  await combo.deleteOne();
  res.status(200).json({ success: true, status: 200, message: "Xóa combo thành công" });
}); 