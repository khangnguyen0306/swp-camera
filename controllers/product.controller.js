import asyncHandler from 'express-async-handler';
import Product from '../models/Product.model.js';
import ProductType from '../models/ProductType.model.js'; // Import model Loại sản phẩm
import Brand from '../models/Brand.model.js'; // Import model Thương hiệu
import mongoose from 'mongoose'; // Import mongoose để kiểm tra ObjectId

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  // RBAC: Chỉ Admin mới có thể tạo sản phẩm
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền tạo sản phẩm');
  }

  const {
    name,
    brand,
    origin,
    description,
    price,
    categories, // Dự kiến là một mảng các ID của Loại sản phẩm
    stock,
    images,
    model,
    type,
    sensorType,
    megapixels,
    lensMount,
    videoResolution,
    connectivity,
    features,
    weight,
    dimensions,
    usageInstructions,
    certifications,
    warnings,
    availabilityType,
    preOrderDeliveryTime,
  } = req.body;

  // Validate required fields
  if (!name || !brand || price === undefined || price === null || stock === undefined || stock === null || !model) {
    res.status(400);
    throw new new Error('Vui lòng cung cấp đủ các trường bắt buộc: tên, thương hiệu (ID), giá, số lượng tồn kho, mẫu mã.');
  }
  
  // Validate price and stock are non-negative numbers
  if (price < 0 || stock < 0) {
      res.status(400);
      throw new Error('Giá và số lượng tồn kho không được âm.');
  }

    // Validate brand ID
    if (!mongoose.Types.ObjectId.isValid(brand)) {
        res.status(400);
        throw new Error('ID thương hiệu không hợp lệ.');
    }
    const brandExists = await Brand.findById(brand);
    if (!brandExists) {
        res.status(400);
        throw new Error('Không tìm thấy thương hiệu với ID đã cung cấp.');
    }

  // Validate categories: must be an array of valid ProductType IDs
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
      res.status(400);
      throw new Error('Vui lòng cung cấp ít nhất một danh mục cho sản phẩm (dưới dạng mảng các ID loại sản phẩm).');
  }

  for (const categoryId of categories) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        res.status(400);
        throw new Error(`ID loại sản phẩm không hợp lệ: ${categoryId}`);
    }
    const productType = await ProductType.findById(categoryId);
    if (!productType) {
      res.status(400);
      throw new Error(`Không tìm thấy loại sản phẩm với ID: ${categoryId}`);
    }
  }

  const product = new Product({
    name,
    brand,
    origin,
    description,
    price,
    categories,
    stock,
    images,
    model,
    type,
    sensorType,
    megapixels,
    lensMount,
    videoResolution,
    connectivity,
    features,
    weight,
    dimensions,
    usageInstructions,
    certifications,
    warnings,
    availabilityType,
    preOrderDeliveryTime,
    // seller đã xóa dựa trên thảo luận trước
    // reviews và rating sẽ được quản lý riêng hoặc mặc định
  });

  const createdProduct = await product.save();
  res.status(201).json({
    success: true,
    data: createdProduct,
    message: 'Tạo sản phẩm thành công',
  });
});

// @desc    Lấy tất cả sản phẩm (có phân trang, tìm kiếm và lọc)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = parseInt(req.query.limit) || 10; // Số lượng sản phẩm trên mỗi trang, mặc định là 10
  const page = parseInt(req.query.page) || 1; // Số trang hiện tại, mặc định là 1

  const filter = {};

  // Search by keyword (on name and model)
  if (req.query.keyword) {
    const keyword = req.query.keyword;
    filter.$or = [
      {
        name: {
          $regex: keyword,
          $options: 'i', // Case-insensitive
        }
      },
      {
        model: {
          $regex: keyword,
          $options: 'i', // Case-insensitive
        }
      },
    ];
  }

  // Filter by brand (expecting comma-separated IDs)
  if (req.query.brand) {
      const brandIds = req.query.brand.split(',').map(id => id.trim()).filter(id => mongoose.Types.ObjectId.isValid(id));
      if (brandIds.length > 0) {
          filter.brand = { $in: brandIds };
      } else if (req.query.brand.split(',').map(id => id.trim()).filter(id => id).length > 0) {
          // If there were inputs but none were valid ObjectIds
           res.status(400);
           throw new Error('Một hoặc nhiều ID thương hiệu không hợp lệ.');
      }
  }

  // Filter by categories (expecting comma-separated IDs)
  if (req.query.categories) {
      const categoryIds = req.query.categories.split(',').map(id => id.trim()).filter(id => mongoose.Types.ObjectId.isValid(id));
      if (categoryIds.length > 0) {
          filter.categories = { $in: categoryIds };
      } else if (req.query.categories.split(',').map(id => id.trim()).filter(id => id).length > 0) {
          // If there were inputs but none were valid ObjectIds
           res.status(400);
           throw new Error('Một hoặc nhiều ID danh mục không hợp lệ.');
      }
  }

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
          const minPrice = parseFloat(req.query.minPrice);
          if (!isNaN(minPrice) && minPrice >= 0) {
              filter.price.$gte = minPrice;
          } else {
               res.status(400);
               throw new Error('Giá tối thiểu không hợp lệ.');
          }
      }
      if (req.query.maxPrice) {
          const maxPrice = parseFloat(req.query.maxPrice);
          if (!isNaN(maxPrice) && maxPrice >= 0) {
              filter.price.$lte = maxPrice;
          } else {
               res.status(400);
               throw new Error('Giá tối đa không hợp lệ.');
          }
      }
  }

    // Filter by stock range
  if (req.query.minStock || req.query.maxStock) {
      filter.stock = {};
      if (req.query.minStock) {
          const minStock = parseInt(req.query.minStock);
           if (!isNaN(minStock) && minStock >= 0) {
              filter.stock.$gte = minStock;
          } else {
               res.status(400);
               throw new Error('Số lượng tồn kho tối thiểu không hợp lệ.');
          }
      }
      if (req.query.maxStock) {
          const maxStock = parseInt(req.query.maxStock);
          if (!isNaN(maxStock) && maxStock >= 0) {
              filter.stock.$lte = maxStock;
          } else {
               res.status(400);
               throw new Error('Số lượng tồn kho tối đa không hợp lệ.');
          }
      }
  }

    // Filter by availability type
  if (req.query.availabilityType) {
      const allowedTypes = ['in_stock', 'pre_order'];
      if(allowedTypes.includes(req.query.availabilityType)){
           filter.availabilityType = req.query.availabilityType;
      } else {
           res.status(400);
           throw new Error('Loại trạng thái có sẵn không hợp lệ. Chỉ chấp nhận: in_stock, pre_order.');
      }
  }

  // Filter by camera specific fields (exact match)
  if (req.query.type) {
      filter.type = req.query.type;
  }
  if (req.query.sensorType) {
      filter.sensorType = req.query.sensorType;
  }
  if (req.query.lensMount) {
      filter.lensMount = req.query.lensMount;
  }

  const count = await Product.countDocuments(filter); // Đếm tổng số sản phẩm phù hợp với bộ lọc

  const products = await Product.find(filter)
    .populate('categories', 'name') // Lấy tên loại sản phẩm
    .populate('brand', 'name') // Lấy tên thương hiệu
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    success: true,
    data: products,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
    message: 'Lấy danh sách sản phẩm thành công',
  });
});

// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('categories', 'name').populate('brand', 'name'); // Lấy tên loại sản phẩm và thương hiệu

  if (product) {
    res.json({
      success: true,
      data: product,
      message: 'Lấy thông tin sản phẩm thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }
});

// @desc    Cập nhật sản phẩm theo ID
// @route   PUT /api/products/:id
// @access  Private/Admin hoặc Manager
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('categories', 'name').populate('brand', 'name');

  if (product) {
    // RBAC: Admin có thể cập nhật tất cả các trường, Manager chỉ có thể cập nhật giá và mô tả
    if (req.user.role === 'admin') {
      const {
        name,
        brand,
        origin,
        description,
        price,
        categories,
        stock,
        images,
        model,
        type,
        sensorType,
        megapixels,
        lensMount,
        videoResolution,
        connectivity,
        features,
        weight,
        dimensions,
        usageInstructions,
        certifications,
        warnings,
        availabilityType,
        preOrderDeliveryTime,
      } = req.body;

        // Validate brand ID if provided
        if (brand !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(brand)) {
                res.status(400);
                throw new Error('ID thương hiệu không hợp lệ.');
            }
            const brandExists = await Brand.findById(brand);
            if (!brandExists) {
                res.status(400);
                throw new Error('Không tìm thấy thương hiệu với ID đã cung cấp.');
            }
            product.brand = brand;
        }

      // Validate categories if provided: must be an array of valid ProductType IDs
      if (categories !== undefined) { // Check if categories is provided in the update request
        if (!Array.isArray(categories) || categories.length === 0) {
            res.status(400);
            throw new Error('Danh mục sản phẩm phải là một mảng chứa ít nhất một ID loại sản phẩm.');
        }
        for (const categoryId of categories) {
          if (!mongoose.Types.ObjectId.isValid(categoryId)) {
              res.status(400);
              throw new Error(`ID loại sản phẩm không hợp lệ: ${categoryId}`);
          }
          const productType = await ProductType.findById(categoryId);
          if (!productType) {
            res.status(400);
            throw new Error(`Không tìm thấy loại sản phẩm với ID: ${categoryId}`);
          }
        }
        product.categories = categories;
      }
      
      // Validate price and stock if provided and are numbers
      if (price !== undefined && price !== null) {
          if (isNaN(price) || price < 0) {
              res.status(400);
              throw new Error('Giá phải là số không âm.');
          }
          product.price = price;
      }

      if (stock !== undefined && stock !== null) {
          if (isNaN(stock) || stock < 0) {
              res.status(400);
              throw new Error('Số lượng tồn kho phải là số không âm.');
          }
          product.stock = stock;
      }

      product.name = name !== undefined ? name : product.name;
      product.origin = origin !== undefined ? origin : product.origin;
      product.description = description !== undefined ? description : product.description;
      product.images = images !== undefined ? images : product.images;
      product.model = model !== undefined ? model : product.model;
      product.type = type !== undefined ? type : product.type;
      product.sensorType = sensorType !== undefined ? sensorType : product.sensorType;
      product.megapixels = megapixels !== undefined ? megapixels : product.megapixels;
      product.lensMount = lensMount !== undefined ? lensMount : product.lensMount;
      product.videoResolution = videoResolution !== undefined ? videoResolution : product.videoResolution;
      product.connectivity = connectivity !== undefined ? connectivity : product.connectivity;
      product.features = features !== undefined ? features : product.features;
      product.weight = weight !== undefined ? weight : product.weight;
      product.dimensions = dimensions !== undefined ? dimensions : product.dimensions;
      product.usageInstructions = usageInstructions !== undefined ? usageInstructions : product.usageInstructions;
      product.certifications = certifications !== undefined ? certifications : product.certifications;
      product.warnings = warnings !== undefined ? warnings : product.warnings;
      product.availabilityType = availabilityType !== undefined ? availabilityType : product.availabilityType;
      product.preOrderDeliveryTime = preOrderDeliveryTime !== undefined ? preOrderDeliveryTime : product.preOrderDeliveryTime;

    } else if (req.user.role === 'manager') {
      // Manager chỉ có thể cập nhật giá và mô tả
      const { price, description } = req.body;
      
      let updatesMade = false;

      if (price !== undefined && price !== null) {
          if (isNaN(price) || price < 0) {
              res.status(400);
              throw new Error('Giá phải là số không âm.');
          }
          product.price = price;
          updatesMade = true;
      }

      if (description !== undefined) {
          product.description = description;
          updatesMade = true;
      }
      
      // Optional: Throw error if Manager tries to update fields other than price or description
      const allowedManagerFields = ['price', 'description'];
      const receivedFields = Object.keys(req.body);
      const disallowedFields = receivedFields.filter(field => !allowedManagerFields.includes(field));

      if (disallowedFields.length > 0) {
          res.status(403);
          throw new Error(`Manager không có quyền cập nhật các trường: ${disallowedFields.join(', ')}`);
      }

       if (!updatesMade) {
           res.status(400);
           throw new Error('Manager phải cung cấp ít nhất giá hoặc mô tả để cập nhật.');
       }

    } else {
      res.status(403);
      throw new Error('Không có quyền cập nhật sản phẩm này');
    }

    const updatedProduct = await product.save();
    res.json({
      success: true,
      data: updatedProduct,
      message: 'Cập nhật sản phẩm thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }
});

// @desc    Xóa sản phẩm theo ID
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  // RBAC: Chỉ Admin mới có thể xóa sản phẩm
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Không có quyền xóa sản phẩm');
  }

  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({
      success: true,
      message: 'Sản phẩm đã được xóa thành công',
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy sản phẩm');
  }
});

export { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
