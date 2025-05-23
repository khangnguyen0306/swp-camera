import asyncHandler from 'express-async-handler';
import Brand from '../models/Brand.model.js';

// @desc    Tạo thương hiệu mới
// @route   POST /api/brands
// @access  Private/Admin
const createBrand = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const brandExists = await Brand.findOne({ name });

  if (brandExists) {
    res.status(400);
    throw new Error('Tên thương hiệu đã tồn tại');
  }

  const brand = await Brand.create({
    name,
    description,
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

// @desc    Lấy thương hiệu theo ID
// @route   GET /api/brands/:id
// @access  Public (hoặc Private tùy yêu cầu)
const getBrandById = asyncHandler(async (req, res) => {
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

// @desc    Cập nhật thương hiệu theo ID
// @route   PUT /api/brands/:id
// @access  Private/Admin
const updateBrand = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const brand = await Brand.findById(req.params.id);

  if (brand) {
    brand.name = name || brand.name;
    brand.description = description || brand.description;

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

// @desc    Xóa thương hiệu theo ID
// @route   DELETE /api/brands/:id
// @access  Private/Admin
const deleteBrand = asyncHandler(async (req, res) => {
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