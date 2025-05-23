import asyncHandler from 'express-async-handler';
import ProductType from '../models/ProductType.model.js';
import mongoose from 'mongoose';

/**
 * @swagger
 * tags:
 *   name: Product Types
 *   description: API để quản lý loại sản phẩm (chỉ Admin)
 */

/**
 * @swagger
 * /api/product-types:
 *   post:
 *     summary: Tạo loại sản phẩm mới (Chỉ Admin)
 *     tags: [Product Types]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên loại sản phẩm (duy nhất)
 *                 example: Camera DSLR
 *               description:
 *                 type: string
 *                 description: Mô tả loại sản phẩm
 *                 example: Các dòng máy ảnh DSLR chuyên nghiệp
 *     responses:
 *       201:
 *         description: Tạo loại sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductType' # Tham chiếu đến schema ProductType
 *                 message:
 *                   type: string
 *                   example: "Tạo loại sản phẩm thành công"
 *       400:
 *         description: Tên loại sản phẩm đã tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tên loại sản phẩm đã tồn tại hoặc dữ liệu không hợp lệ"
 *       401:
 *         description: Không có quyền truy cập (token không hợp lệ/hết hạn)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token không hợp lệ, không có quyền truy cập"
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chỉ Admin mới có quyền truy cập"
 */

/**
 * @swagger
 * /api/product-types:
 *   get:
 *     summary: Lấy tất cả loại sản phẩm
 *     tags: [Product Types]
 *     responses:
 *       200:
 *         description: Danh sách loại sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductType'
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách loại sản phẩm thành công"
 *       500:
 *         description: Lỗi server
 */
// @desc    Tạo loại sản phẩm mới
// @route   POST /api/product-types
// @access  Private/Admin
const createProductType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const productTypeExists = await ProductType.findOne({ name });

  if (productTypeExists) {
    res.status(400);
    throw new Error('Tên loại sản phẩm đã tồn tại');
  }

  const productType = await ProductType.create({
    name,
    description,
  });

  if (productType) {
    res.status(201).json({
      success: true,
      data: productType,
      message: 'Tạo loại sản phẩm thành công',
    });
  } else {
    res.status(400);
    throw new Error('Dữ liệu loại sản phẩm không hợp lệ');
  }
});

// @desc    Lấy tất cả loại sản phẩm
// @route   GET /api/product-types
// @access  Public (hoặc Private tùy yêu cầu)
const getProductTypes = asyncHandler(async (req, res) => {
  const productTypes = await ProductType.find({});
  res.json({
    success: true,
    data: productTypes,
    message: 'Lấy danh sách loại sản phẩm thành công',
  });
});

/**
 * @swagger
 * /api/product-types/{id}:
 *   get:
 *     summary: Lấy loại sản phẩm theo ID
 *     tags: [Product Types]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của loại sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Thông tin loại sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductType'
 *                 message:
 *                   type: string
 *                   example: "Lấy thông tin loại sản phẩm thành công"
 *       404:
 *         description: Không tìm thấy loại sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy loại sản phẩm"
 *       400:
 *         description: ID loại sản phẩm không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID loại sản phẩm không hợp lệ."
 */
// @desc    Get product type by ID
// @route   GET /api/product-types/:id
// @access  Public (hoặc Private tùy yêu cầu)
const getProductTypeById = asyncHandler(async (req, res) => {
  // Added validation for ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('ID loại sản phẩm không hợp lệ.');
  }
  const productType = await ProductType.findById(req.params.id);

  if (productType) {
    res.json({
      success: true,
      data: productType,
      message: 'Lấy thông tin loại sản phẩm thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy loại sản phẩm');
  }
});

/**
 * @swagger
 * /api/product-types/{id}:
 *   put:
 *     summary: Cập nhật loại sản phẩm theo ID (Chỉ Admin)
 *     tags: [Product Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của loại sản phẩm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên loại sản phẩm
 *                 example: Camera Mirrorless
 *               description:
 *                 type: string
 *                 description: Mô tả loại sản phẩm
 *                 example: Các dòng máy ảnh Mirrorless nhỏ gọn
 *     responses:
 *       200:
 *         description: Cập nhật loại sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductType'
 *                 message:
 *                   type: string
 *                   example: "Cập nhật loại sản phẩm thành công"
 *       400:
 *         description: Tên loại sản phẩm đã tồn tại hoặc dữ liệu không hợp lệ, hoặc ID không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tên loại sản phẩm đã tồn tại hoặc dữ liệu không hợp lệ hoặc ID không hợp lệ."
 *       401:
 *         description: Không có quyền truy cập (token không hợp lệ/hết hạn)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token không hợp lệ, không có quyền truy cập"
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chỉ Admin mới có quyền truy cập"
 *       404:
 *         description: Không tìm thấy loại sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy loại sản phẩm"
 */
// @desc    Cập nhật loại sản phẩm theo ID
// @route   PUT /api/product-types/:id
// @access  Private/Admin
const updateProductType = asyncHandler(async (req, res) => {
  // Added validation for ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('ID loại sản phẩm không hợp lệ.');
  }
  const { name, description } = req.body;

  const productType = await ProductType.findById(req.params.id);

  if (productType) {
    // Optional: Check if name already exists for another product type during update
    if (name && name !== productType.name) {
        const existingProductType = await ProductType.findOne({ name });
        if (existingProductType) {
            res.status(400);
            throw new Error('Tên loại sản phẩm đã tồn tại');
        }
    }

    productType.name = name !== undefined ? name : productType.name;
    productType.description = description !== undefined ? description : productType.description;

    const updatedProductType = await productType.save();
    res.json({
      success: true,
      data: updatedProductType,
      message: 'Cập nhật loại sản phẩm thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy loại sản phẩm');
  }
});

/**
 * @swagger
 * /api/product-types/{id}:
 *   delete:
 *     summary: Xóa loại sản phẩm theo ID (Chỉ Admin)
 *     tags: [Product Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của loại sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Loại sản phẩm đã được xóa thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Loại sản phẩm đã được xóa thành công"
 *       400:
 *         description: ID loại sản phẩm không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID loại sản phẩm không hợp lệ."
 *       401:
 *         description: Không có quyền truy cập (token không hợp lệ/hết hạn)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token không hợp lệ, không có quyền truy cập"
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chỉ Admin mới có quyền truy cập"
 *       404:
 *         description: Không tìm thấy loại sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy loại sản phẩm"
 *       500:
 *         description: Lỗi server
 */
// @desc    Delete product type by ID
// @route   DELETE /api/product-types/:id
// @access  Private/Admin
const deleteProductType = asyncHandler(async (req, res) => {
  // Added validation for ObjectId
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error('ID loại sản phẩm không hợp lệ.');
  }
  const productType = await ProductType.findById(req.params.id);

  if (productType) {
    await productType.deleteOne();
    res.json({
      success: true,
      message: 'Loại sản phẩm đã được xóa thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy loại sản phẩm');
  }
});

export { createProductType, getProductTypes, getProductTypeById, updateProductType, deleteProductType }; 