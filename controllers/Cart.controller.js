import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import asyncHandler from 'express-async-handler';

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: API quản lý giỏ hàng
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         product:
 *           type: string
 *           description: ID của sản phẩm
 *         quantity:
 *           type: number
 *           description: Số lượng sản phẩm
 *         price:
 *           type: number
 *           description: Giá sản phẩm
 *         selected:
 *           type: boolean
 *           description: Trạng thái chọn sản phẩm
 *     Cart:
 *       type: object
 *       properties:
 *         customer:
 *           type: string
 *           description: ID của khách hàng
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         totalPrice:
 *           type: number
 *           description: Tổng giá trị giỏ hàng
 *         totalItems:
 *           type: number
 *           description: Tổng số sản phẩm trong giỏ hàng
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Lấy thông tin giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin giỏ hàng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Không có quyền truy cập
 */

// @desc    Lấy giỏ hàng của khách hàng
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ customer: req.user._id })
        .populate({
            path: 'items.product',
            select: 'name price images stock description category brand origin model type sensorType megapixels lensMount videoResolution connectivity features weight dimensions usageInstructions certifications warnings rating reviews availabilityType preOrderDeliveryTime'
        });

    if (!cart) {
        return res.status(200).json({ items: [], totalPrice: 0, totalItems: 0 });
    }

    res.status(200).json(cart);
});

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID của sản phẩm
 *               quantity:
 *                 type: number
 *                 description: Số lượng sản phẩm (mặc định là 1)
 *     responses:
 *       200:
 *         description: Thêm sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Số lượng sản phẩm không hợp lệ hoặc không đủ hàng
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm
 */

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }

    // Kiểm tra số lượng tồn kho
    if (product.stock < quantity) {
        res.status(400);
        throw new Error('Số lượng sản phẩm trong kho không đủ');
    }

    let cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
        // Tạo giỏ hàng mới nếu chưa có
        cart = await Cart.create({
            customer: req.user._id,
            items: [{
                product: productId,
                quantity,
                price: product.price,
                name: product.name
            }]
        });
    } else {
        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            // Cập nhật số lượng nếu sản phẩm đã có
            existingItem.quantity += quantity;
            if (existingItem.quantity > product.stock) {
                res.status(400);
                throw new Error('Số lượng sản phẩm trong kho không đủ');
            }
        } else {
            // Thêm sản phẩm mới vào giỏ hàng
            cart.items.push({
                product: productId,
                quantity,
                price: product.price,
                name: product.name
            });
        }
    }

    // Tính toán lại tổng giá và số lượng
    cart.calculateTotals();
    await cart.save();

    res.status(200).json(cart);
});

/**
 * @swagger
 * /api/cart/{productId}:
 *   put:
 *     summary: Cập nhật số lượng sản phẩm trong giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 description: Số lượng mới của sản phẩm
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Số lượng không hợp lệ hoặc không đủ hàng
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc giỏ hàng
 */

// @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;
    const { productId } = req.params;

    if (quantity < 1) {
        res.status(400);
        throw new Error('Số lượng phải lớn hơn 0');
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Sản phẩm không tồn tại');
    }

    if (product.stock < quantity) {
        res.status(400);
        throw new Error('Số lượng sản phẩm trong kho không đủ');
    }

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }

    const cartItem = cart.items.find(
        item => item.product.toString() === productId
    );

    if (!cartItem) {
        res.status(404);
        throw new Error('Sản phẩm không có trong giỏ hàng');
    }

    cartItem.quantity = quantity;
    cart.calculateTotals();
    await cart.save();

    res.status(200).json(cart);
});

/**
 * @swagger
 * /api/cart/{productId}:
 *   delete:
 *     summary: Xóa sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Xóa sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy giỏ hàng
 */

// @desc    Xóa sản phẩm khỏi giỏ hàng
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }

    cart.items = cart.items.filter(
        item => item.product.toString() !== productId
    );

    cart.calculateTotals();
    await cart.save();

    res.status(200).json(cart);
});

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Xóa toàn bộ giỏ hàng
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xóa giỏ hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy giỏ hàng
 */

// @desc    Xóa toàn bộ giỏ hàng
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }

    cart.items = [];
    cart.calculateTotals();
    await cart.save();

    res.status(200).json(cart);
});

/**
 * @swagger
 * /api/cart/select/{productId}:
 *   put:
 *     summary: Cập nhật trạng thái chọn sản phẩm
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - selected
 *             properties:
 *               selected:
 *                 type: boolean
 *                 description: Trạng thái chọn sản phẩm
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy sản phẩm hoặc giỏ hàng
 */

// @desc    Cập nhật trạng thái chọn sản phẩm
// @route   PUT /api/cart/select/:productId
// @access  Private
const toggleSelectItem = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const { selected } = req.body;

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
        res.status(404);
        throw new Error('Giỏ hàng không tồn tại');
    }

    const cartItem = cart.items.find(
        item => item.product.toString() === productId
    );

    if (!cartItem) {
        res.status(404);
        throw new Error('Sản phẩm không có trong giỏ hàng');
    }

    cartItem.selected = selected;
    await cart.save();

    res.status(200).json(cart);
});

export {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    toggleSelectItem
}; 