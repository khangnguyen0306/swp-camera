import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProductTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  }, // Tên loại sản phẩm
  description: {
    type: String,
    default: '',
  }, // Mô tả loại sản phẩm
}, {
  timestamps: true, // Thêm các trường createdAt và updatedAt
});

const ProductType = mongoose.model('ProductType', ProductTypeSchema);

export default ProductType; 