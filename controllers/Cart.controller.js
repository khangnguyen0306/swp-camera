import Cart from '../models/Cart.model.js';
import Product from '../models/Product.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Lấy giỏ hàng của khách hàng
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ customer: req.user._id })
        .populate('items.product', 'name price images stock');

    if (!cart) {
        return res.status(200).json({ items: [], totalPrice: 0, totalItems: 0 });
    }

    res.status(200).json(cart);
});

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
                price: product.price
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
                price: product.price
            });
        }
    }

    // Tính toán lại tổng giá và số lượng
    cart.calculateTotals();
    await cart.save();

    res.status(200).json(cart);
});

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