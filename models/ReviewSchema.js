import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReviewSchema = new Schema({
  product:   { type: Schema.Types.ObjectId, ref: 'Product', required: true }, // Sản phẩm được đánh giá
  customer:  { type: Schema.Types.ObjectId, ref: 'Customer', required: true }, // Người đánh giá
  rating:    { type: Number, required: true, min: 1, max: 5 }, // Số sao
  comment:   { type: String }, // Nhận xét
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', ReviewSchema);
export default Review;