// models/customer.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const CartItemSchema = new Schema({
    product:  { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 }
}, { _id: false });

const CustomerSchema = new Schema({
    // Liên kết đến Auth/Account
    accountId:   { type: Schema.Types.ObjectId, ref: 'Auth', required: true, unique: true },

    // Thông tin cá nhân
    username:    { type: String, required: true, unique: true },
    email:       { type: String, required: true, unique: true },
    dateOfBirth: { type: Date },
    gender:      { type: String, enum: ['male', 'female', 'other'] },
    avatarUrl:   { type: String, default: '' },

    // Địa chỉ lưu dạng mảng string
    addresses:   { type: [String], default: [] },

    // Giỏ hàng
    cart:        { type: [CartItemSchema], default: [] },

    // Lịch sử đơn hàng
    orderHistory:[{ type: Schema.Types.ObjectId, ref: 'Order' }],

    // Loyalty
    loyaltyPoints: { type: Number, default: 0 },
    isVIP:         { type: Boolean, default: false },

    // Cài đặt người dùng
    preferences: { newsletterSubscribed: { type: Boolean, default: true } },

    // Thời gian
    createdAt:   { type: Date, default: Date.now },
    updatedAt:   { type: Date, default: Date.now }
});

// Auto-update updatedAt
CustomerSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Index email for faster lookup
CustomerSchema.index({ email: 1 });

const Customer = mongoose.model('Customer', CustomerSchema);
export default Customer;
