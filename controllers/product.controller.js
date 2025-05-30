import asyncHandler from 'express-async-handler';
import Product from '../models/Product.model.js';
import ProductType from '../models/ProductType.model.js'; // Import model Loại sản phẩm
import Brand from '../models/Brand.model.js'; // Import model Thương hiệu
import mongoose from 'mongoose'; // Import mongoose để kiểm tra ObjectId
import Combo from '../models/Combo.model.js';

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API để quản lý sản phẩm
 */

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Tạo sản phẩm mới (Chỉ Admin)
 *     tags: [Products]
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
 *               - brand
 *               - price
 *               - stock
 *               - model
 *               - categories # Assuming categories is required during creation
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên sản phẩm
 *                 example: Camera Canon EOS R5
 *               brand:
 *                 type: string
 *                 description: ID của thương hiệu
 *                 example: 60f0a9c1a6b7c3001f123456
 *               origin:
 *                 type: string
 *                 description: Xuất xứ
 *                 example: Nhật Bản
 *               description:
 *                 type: string
 *                 description: Mô tả sản phẩm
 *                 example: Máy ảnh Mirrorless full-frame cao cấp
 *               price:
 *                 type: number
 *                 description: Giá bán (không âm)
 *                 example: 3899.00
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mảng các ID của loại sản phẩm
 *                 example: ["60f0a9c1a6b7c3001f123457", "60f0a9c1a6b7c3001f123458"]
 *               stock:
 *                 type: integer
 *                 description: Số lượng tồn kho (không âm)
 *                 example: 10
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách các URL hình ảnh sản phẩm
 *                 example: ["http://example.com/img1.jpg", "http://example.com/img2.jpg"]
 *               model:
 *                 type: string
 *                 description: Tên/số hiệu mẫu máy
 *                 example: EOS R5
 *               type:
 *                 type: string
 *                 description: Loại máy ảnh (DSLR, Mirrorless, v.v.)
 *                 example: Mirrorless
 *               sensorType:
 *                 type: string
 *                 description: Loại cảm biến (Full-Frame CMOS, APS-C CMOS, v.v.)
 *                 example: Full-Frame CMOS
 *               megapixels:
 *                 type: number
 *                 description: Độ phân giải (Megapixels)
 *                 example: 45
 *               lensMount:
 *                 type: string
 *                 description: Loại ngàm ống kính
 *                 example: Canon RF
 *               videoResolution:
 *                 type: string
 *                 description: Độ phân giải video tối đa (4K, 8K, v.v.)
 *                 example: 8K DCI
 *               connectivity:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Kết nối (Wi-Fi, Bluetooth, USB-C, v.v.)
 *                 example: ["Wi-Fi", "Bluetooth", "USB-C"]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Các tính năng nổi bật
 *                 example: ["In-Body Image Stabilization", "Dual Card Slots"]
 *               weight:
 *                 type: number
 *                 description: string
 *                 example: 738
 *               dimensions:
 *                 type: string
 *                 description: string
 *                 example: 138.5 x 97.5 x 88.0 mm
 *               usageInstructions:
 *                 type: string
 *                 description: Hướng dẫn sử dụng
 *               certifications:
 *                 type: array
 *                 items: { type: 'string' }
 *                 description: Chứng nhận (CE, FCC, v.v.)
 *               warnings:
 *                 type: string
 *                 description: Cảnh báo sử dụng
 *               availabilityType:
 *                 type: string
 *                 enum: ['in_stock', 'pre_order']
 *                 description: Trạng thái có sẵn (in_stock hoặc pre_order)
 *                 example: in_stock
 *               preOrderDeliveryTime:
 *                 type: string
 *                 description: Thời gian giao hàng dự kiến (nếu là pre_order)
 *                 example: 2-3 tuần
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: "Tạo sản phẩm thành công"
 *       400:
 *         description: Dữ liệu không hợp lệ (thiếu trường bắt buộc, giá/stock âm, ID không hợp lệ, loại sản phẩm/thương hiệu không tồn tại)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Vui lòng cung cấp đủ các trường bắt buộc: tên, thương hiệu (ID), giá, số lượng tồn kho, mẫu mã. or Giá và số lượng tồn kho không được âm. or ID thương hiệu không hợp lệ."
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
 *         description: Không có quyền tạo sản phẩm (không phải Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không có quyền tạo sản phẩm"
 *       500:
 *         description: Lỗi server
 */

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
    throw new Error('Vui lòng cung cấp đủ các trường bắt buộc: tên, thương hiệu (ID), giá, số lượng tồn kho, mẫu mã.');
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

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Lấy tất cả sản phẩm (có phân trang, tìm kiếm và lọc)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm theo tên hoặc mẫu mã sản phẩm
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số trang (mặc định là 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Số lượng sản phẩm trên mỗi trang (mặc định là 10)
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Lọc theo ID thương hiệu (có thể truyền nhiều ID cách nhau bằng dấu phẩy)
 *         example: 60f0a9c1a6b7c3001f123456,60f0a9c1a6b7c3001f123459
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Lọc theo ID loại sản phẩm (có thể truyền nhiều ID cách nhau bằng dấu phẩy)
 *         example: 60f0a9c1a6b7c3001f123457,60f0a9c1a6b7c3001f123458
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Lọc theo giá tối thiểu
 *         example: 500
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Lọc theo giá tối đa
 *         example: 2000
 *       - in: query
 *         name: minStock
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Lọc theo số lượng tồn kho tối thiểu
 *         example: 5
 *       - in: query
 *         name: maxStock
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Lọc theo số lượng tồn kho tối đa
 *         example: 50
 *       - in: query
 *         name: availabilityType
 *         schema:
 *           type: string
 *           enum: ['in_stock', 'pre_order']
 *         description: Lọc theo trạng thái có sẵn
 *         example: in_stock
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Loại máy ảnh (ví dụ Mirrorless)
 *         example: Mirrorless
 *       - in: query
 *         name: sensorType
 *         schema:
 *           type: string
 *         description: Loại cảm biến (ví dụ Full-Frame CMOS)
 *         example: Full-Frame CMOS
 *       - in: query
 *         name: lensMount
 *         schema:
 *           type: string
 *         description: Loại ngàm ống kính (ví dụ Canon RF)
 *         example: Canon RF
 *     responses:
 *       200:
 *         description: Danh sách sản phẩm
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
 *                     $ref: '#/components/schemas/Product' # Tham chiếu đến schema Product
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 pages:
 *                   type: integer
 *                   example: 5
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 message:
 *                   type: string
 *                   example: "Lấy danh sách sản phẩm thành công"
 *       400:
 *         description: Tham số lọc không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Một hoặc nhiều ID thương hiệu không hợp lệ. or Giá tối thiểu không hợp lệ. or Một hoặc nhiều ID danh mục không hợp lệ."
 *       500:
 *         description: Lỗi server
 */

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

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần lấy
 *     responses:
 *       200:
 *         description: Thông tin sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product' # Tham chiếu đến schema Product
 *                 message:
 *                   type: string
 *                   example: "Lấy thông tin sản phẩm thành công"
 *       404:
 *         description: Không tìm thấy sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy sản phẩm"
 *       400:
 *         description: ID sản phẩm không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID sản phẩm không hợp lệ."
 *       500:
 *         description: Lỗi server
 */

// @desc    Lấy sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
   // Added validation for ObjectId
   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       res.status(400);
       throw new Error('ID sản phẩm không hợp lệ.');
   }
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

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Cập nhật sản phẩm theo ID (Admin hoặc Manager)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên sản phẩm
 *                 example: Camera Canon EOS R6 Mark II
 *               brand:
 *                 type: string
 *                 description: ID của thương hiệu
 *                 example: 60f0a9c1a6b7c3001f123456
 *               origin:
 *                 type: string
 *                 description: Xuất xứ
 *                 example: Nhật Bản
 *               description:
 *                 type: string
 *                 description: Mô tả sản phẩm
 *                 example: Máy ảnh Mirrorless full-frame đa dụng
 *               price:
 *                 type: number
 *                 description: Giá bán (không âm)
 *                 example: 2499.00
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mảng các ID của loại sản phẩm
 *                 example: ["60f0a9c1a6b7c3001f123457"]
 *               stock:
 *                 type: integer
 *                 description: Số lượng tồn kho (không âm)
 *                 example: 15
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách các URL hình ảnh sản phẩm
 *                 example: ["http://example.com/img3.jpg"]
 *               model:
 *                 type: string
 *                 description: Tên/số hiệu mẫu máy
 *                 example: EOS R6 Mark II
 *               type:
 *                 type: string
 *                 description: Loại máy ảnh (DSLR, Mirrorless, v.v.)
 *                 example: Mirrorless
 *               sensorType:
 *                 type: string
 *                 description: Loại cảm biến (Full-Frame CMOS, APS-C CMOS, v.v.)
 *                 example: Full-Frame CMOS
 *               megapixels:
 *                 type: number
 *                 description: Độ phân giải (Megapixels)
 *                 example: 24.2
 *               lensMount:
 *                 type: string
 *                 description: Loại ngàm ống kính
 *                 example: Canon RF
 *               videoResolution:
 *                 type: string
 *                 description: Độ phân giải video tối đa (4K, 8K, v.v.)
 *                 example: 6K oversampled from 4K
 *               connectivity:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Kết nối (Wi-Fi, Bluetooth, USB-C, v.v.)
 *                 example: ["Wi-Fi", "Bluetooth", "USB-C", "HDMI"]
 *               features:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Các tính năng nổi bật
 *                 example: ["In-Body Image Stabilization", "High-Speed Continuous Shooting"]
 *               weight:
 *                 type: number
 *                 description: Trọng lượng (gam)
 *                 example: 670
 *               dimensions:
 *                 type: string
 *                 description: Kích thước (ví dụ RxCxS)
 *                 example: 132 x 88 x 83.4 mm
 *               usageInstructions:
 *                 type: string
 *                 description: Hướng dẫn sử dụng
 *               certifications:
 *                 type: array
 *                 items: { type: 'string' }
 *                 description: Chứng nhận (CE, FCC, v.v.)
 *               warnings:
 *                 type: string
 *                 description: Cảnh báo sử dụng
 *               availabilityType:
 *                 type: string
 *                 enum: ['in_stock', 'pre_order']
 *                 description: Trạng thái có sẵn (in_stock hoặc pre_order)
 *                 example: in_stock
 *               preOrderDeliveryTime:
 *                 type: string
 *                 description: Thời gian giao hàng dự kiến (nếu là pre_order)
 *                 example: null
 *     responses:
 *       200:
 *         description: Cập nhật sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *                   example: "Cập nhật sản phẩm thành công"
 *       400:
 *         description: Dữ liệu không hợp lệ (giá/stock âm, ID không hợp lệ, loại sản phẩm/thương hiệu không tồn tại, Manager cố gắng cập nhật trường không được phép)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dữ liệu cập nhật không hợp lệ."
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
 *         description: Không có quyền cập nhật sản phẩm này (quyền không đủ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không có quyền cập nhật sản phẩm này"
 *       404:
 *         description: Không tìm thấy sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy sản phẩm"
 *       500:
 *         description: Lỗi server
 */

// @desc    Cập nhật sản phẩm theo ID
// @route   PUT /api/products/:id
// @access  Private/Admin hoặc Manager
const updateProduct = asyncHandler(async (req, res) => {
   // Added validation for ObjectId
   if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       res.status(400);
       throw new Error('ID sản phẩm không hợp lệ.');
   }
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

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Xóa sản phẩm theo ID (Chỉ Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Sản phẩm đã được xóa thành công
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
 *                   example: "Sản phẩm đã được xóa thành công"
 *       400:
 *         description: ID sản phẩm không hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ID sản phẩm không hợp lệ."
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
 *         description: Không có quyền xóa sản phẩm (không phải Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không có quyền xóa sản phẩm"
 *       404:
 *         description: Không tìm thấy sản phẩm
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Không tìm thấy sản phẩm"
 *       500:
 *         description: Lỗi server
 */

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
    // Kiểm tra sản phẩm có nằm trong combo nào không
    const combos = await Combo.find({ products: product._id });
    if (combos.length > 0) {
      const comboNames = combos.map(c => c.name).join(', ');
      return res.status(400).json({
        success: false,
        message: `Sản phẩm đang nằm trong combo: ${comboNames}. Vui lòng xóa hoặc sửa combo trước khi xóa sản phẩm.`
      });
    }
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
