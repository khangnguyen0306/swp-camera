import mongoose from 'mongoose';
const { Schema } = mongoose;

const CartItemSchema = new Schema({
    product: { 
        type: Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
    },
    quantity: { 
        type: Number, 
        required: true, 
        min: 1 
    },
    price: {
        type: Number,
        required: true
    },
    selected: {
        type: Boolean,
        default: true
    }
}, { _id: false });

const CartSchema = new Schema({
    customer: { 
        type: Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    },
    items: [CartItemSchema],
    totalPrice: {
        type: Number,
        default: 0
    },
    totalItems: {
        type: Number,
        default: 0
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Tự động cập nhật updatedAt
CartSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Tính toán lại tổng giá và số lượng sản phẩm
CartSchema.methods.calculateTotals = function() {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return this;
};

const Cart = mongoose.model('Cart', CartSchema);
export default Cart;
