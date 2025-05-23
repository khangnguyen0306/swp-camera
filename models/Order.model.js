import mongoose from 'mongoose';

const { Schema } = mongoose;

const OrderSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderItems: [
    {
      product:  { type: Schema.Types.ObjectId, ref: 'Product', required: true },
      name:     { type: String, required: true },
      quantity: { type: Number, required: true },
      image:    { type: String, required: true },
      price:    { type: Number, required: true }
    }
  ],
  shippingAddress: { type: String, required: true },
  paymentMethod:    { type: String, required: true },
  paymentResult:    {
    id:           { type: String },
    status:       { type: String },
    update_time:  { type: String },
    email_address:{ type: String }
  },
  taxPrice:         { type: Number, required: true, default: 0.0 },
  shippingPrice:    { type: Number, required: true, default: 0.0 },
  totalPrice:       { type: Number, required: true, default: 0.0 },
  isPaid:           { type: Boolean, required: true, default: false },
  paidAt:           { type: Date },
  isDelivered:      { type: Boolean, required: true, default: false },
  deliveredAt:      { type: Date },
  createdAt:        { type: Date, default: Date.now },
  updatedAt:        { type: Date, default: Date.now }
});

OrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Order = mongoose.model('Order', OrderSchema);
export default Order;