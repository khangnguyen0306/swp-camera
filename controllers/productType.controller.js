import asyncHandler from 'express-async-handler';
import ProductType from '../models/ProductType.model.js';

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

// @desc    Lấy loại sản phẩm theo ID
// @route   GET /api/product-types/:id
// @access  Public (hoặc Private tùy yêu cầu)
const getProductTypeById = asyncHandler(async (req, res) => {
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

// @desc    Cập nhật loại sản phẩm theo ID
// @route   PUT /api/product-types/:id
// @access  Private/Admin
const updateProductType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const productType = await ProductType.findById(req.params.id);

  if (productType) {
    productType.name = name || productType.name;
    productType.description = description || productType.description;

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

// @desc    Xóa loại sản phẩm theo ID
// @route   DELETE /api/product-types/:id
// @access  Private/Admin
const deleteProductType = asyncHandler(async (req, res) => {
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