import mongoose from 'mongoose';
const { Schema } = mongoose;

const OrderItemSchema = new Schema({
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
    name: {
        type: String,
        required: true
    }
}, { _id: false });

const PaymentSchema = new Schema({
    method: {
        type: String,
        enum: ['cod', 'payos'],
        default: 'cod'
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    transactionId: String,
    paymentTime: Date,
    paymentDetails: Schema.Types.Mixed
}, { _id: false });

const OrderSchema = new Schema({
    orderCode: {
        type: Number,
        required: true,
        unique: true
    },
    customer: { 
        type: Schema.Types.ObjectId, 
        ref: 'Auth', 
        required: true 
    },
    combo: { type: Schema.Types.ObjectId, ref: 'Combo' },
    items: [OrderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'accepted', 'deliverying', 'completed', 'cancelled'],
        default: 'pending'
    },
    customerInfo: {
        username: { type: String, required: true },
        email: { type: String, required: true }
    },
    payment: {
        type: PaymentSchema,
        default: () => ({})
    },
    pickupTime: {
        type: Date,
        required: true
    },
    note: { type: String },
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
OrderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;
