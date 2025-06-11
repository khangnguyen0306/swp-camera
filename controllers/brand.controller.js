import asyncHandler from 'express-async-handler';
import Brand from '../models/Brand.model.js';
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: API để quản lý thương hiệu sản phẩm (chỉ Admin)
 */

/**
 * @swagger
 * /api/brands:
 *   post:
 *     summary: Tạo thương hiệu mới (Chỉ Admin)
 *     tags: [Brands]
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
 *                 description: Tên thương hiệu (duy nhất)
 *                 example: Canon
 *               description:
 *                 type: string
 *                 description: Mô tả thương hiệu
 *                 example: Thương hiệu máy ảnh nổi tiếng từ Nhật Bản
 *               image:
 *                 type: string
 *                 description: URL hoặc đường dẫn ảnh thương hiệu
 *                 example: https://example.com/brand-logo.png
 *     responses:
 *       201:
 *         description: Tạo thương hiệu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Brand'
 *                 message:
 *                   type: string
 *                   example: "Tạo thương hiệu thành công"
 *       400:
 *         description: Tên thương hiệu đã tồn tại hoặc dữ liệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tên thương hiệu đã tồn tại hoặc dữ liệu không hợp lệ"
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

// @desc    Tạo thương hiệu mới
// @route   POST /api/brands
// @access  Private/Admin
const createBrand = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  const brandExists = await Brand.findOne({ name });

  if (brandExists) {
    res.status(400);
    throw new Error('Tên thương hiệu đã tồn tại');
  }

  const brand = await Brand.create({
    name,
    description,
    image,
  });

  if (brand) {
    res.status(201).json({
        success: true,
        data: brand,
        message: 'Tạo thương hiệu thành công',
    });
  } else {
    res.status(400);
    throw new Error('Dữ liệu thương hiệu không hợp lệ');
  }
});

/**
 * @swagger
 * /api/brands:
 *   get:
 *     summary: Lấy tất cả thương hiệu
 *     tags: [Brands]
 *     responses:
 *       200:
 *         description: Danh sách thương hiệu
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
 *                     $ref: '#/components/schemas/Brand'
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách thương hiệu thành công"
 *       500:
 *         description: Lỗi server
 */

// @desc    Lấy tất cả thương hiệu
// @route   GET /api/brands
// @access  Public (hoặc Private tùy yêu cầu)
const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({});
  res.json({
      success: true,
      data: brands,
      message: 'Lấy danh sách thương hiệu thành công',
  });
});

/**
 * @swagger
 * /api/brands/{id}:
 *   get:
 *     summary: Lấy thương hiệu theo ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của thương hiệu cần lấy
 *     responses:
 *       200:
 *         description: Thông tin thương hiệu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Brand'
 *                 message:
 *                   type: string
 *                   example: "Lấy thông tin thương hiệu thành công"
 *       404:
 *         description: Không tìm thấy thương hiệu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy thương hiệu"
 *       400:
 *         description: ID thương hiệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID thương hiệu không hợp lệ."
 */

// @desc    Lấy thương hiệu theo ID
// @route   GET /api/brands/:id
// @access  Public (hoặc Private tùy yêu cầu)
const getBrandById = asyncHandler(async (req, res) => {
   // Added validation for ObjectId
   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       res.status(400);
       throw new Error('ID thương hiệu không hợp lệ.');
   }
  const brand = await Brand.findById(req.params.id);

  if (brand) {
    res.json({
        success: true,
        data: brand,
        message: 'Lấy thông tin thương hiệu thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thương hiệu');
  }
});

/**
 * @swagger
 * /api/brands/{id}:
 *   put:
 *     summary: Cập nhật thương hiệu theo ID (Chỉ Admin)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của thương hiệu cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên thương hiệu
 *                 example: Sony
 *               description:
 *                 type: string
 *                 description: Mô tả thương hiệu
 *                 example: Thương hiệu điện tử và máy ảnh nổi tiếng
 *               image:
 *                 type: string
 *                 description: URL hoặc đường dẫn ảnh thương hiệu
 *                 example: https://example.com/brand-logo.png
 *     responses:
 *       200:
 *         description: Cập nhật thương hiệu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Brand'
 *                 message:
 *                   type: string
 *                   example: "Cập nhật thương hiệu thành công"
 *       400:
 *         description: Tên thương hiệu đã tồn tại hoặc dữ liệu không hợp lệ, hoặc ID không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tên thương hiệu đã tồn tại hoặc dữ liệu không hợp lệ hoặc ID không hợp lệ."
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
 *         description: Không tìm thấy thương hiệu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy thương hiệu"
 */

// @desc    Cập nhật thương hiệu theo ID
// @route   PUT /api/brands/:id
// @access  Private/Admin
const updateBrand = asyncHandler(async (req, res) => {
   // Added validation for ObjectId
   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       res.status(400);
       throw new Error('ID thương hiệu không hợp lệ.');
   }
  const { name, description, image } = req.body;

  const brand = await Brand.findById(req.params.id);

  if (brand) {
    // Optional: Check if name already exists for another brand during update
    if (name && name !== brand.name) {
        const existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            res.status(400);
            throw new Error('Tên thương hiệu đã tồn tại');
        }
    }

    brand.name = name !== undefined ? name : brand.name;
    brand.description = description !== undefined ? description : brand.description;
    brand.image = image !== undefined ? image : brand.image;

    const updatedBrand = await brand.save();
    res.json({
        success: true,
        data: updatedBrand,
        message: 'Cập nhật thương hiệu thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thương hiệu');
  }
});

/**
 * @swagger
 * /api/brands/{id}:
 *   delete:
 *     summary: Xóa thương hiệu theo ID (Chỉ Admin)
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của thương hiệu cần xóa
 *     responses:
 *       200:
 *         description: Thương hiệu đã được xóa thành công
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
 *                   example: "Thương hiệu đã được xóa thành công"
 *       400:
 *         description: ID thương hiệu không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID thương hiệu không hợp lệ."
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
 *         description: Không tìm thấy thương hiệu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy thương hiệu"
 *       500:
 *         description: Lỗi server
 */

// @desc    Xóa thương hiệu theo ID
// @route   DELETE /api/brands/:id
// @access  Private/Admin
const deleteBrand = asyncHandler(async (req, res) => {
   // Added validation for ObjectId
   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       res.status(400);
       throw new Error('ID thương hiệu không hợp lệ.');
   }
  const brand = await Brand.findById(req.params.id);

  if (brand) {
    await brand.deleteOne();
    res.json({
        success: true,
        message: 'Thương hiệu đã được xóa thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy thương hiệu');
  }
});

export { createBrand, getBrands, getBrandById, updateBrand, deleteBrand }; 