import mongoose from 'mongoose';
const { Schema } = mongoose;

const VoucherSchema = new Schema({
  code:        { type: String, required: true, unique: true },
  discount:    { type: Number, required: true }, // % hoặc số tiền
  type:        { type: String, enum: ['percent', 'fixed'], required: true },
  minOrder:    { type: Number, default: 0 },
  maxDiscount: { type: Number },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  usageLimit:  { type: Number, default: 1 },
  usedBy:      [{ type: Schema.Types.ObjectId, ref: 'Customer' }],
  createdAt:   { type: Date, default: Date.now }
});

const Voucher = mongoose.model('Voucher', VoucherSchema);
export default Voucher;