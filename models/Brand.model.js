import mongoose from 'mongoose';

const { Schema } = mongoose;

const BrandSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  }, // Tên thương hiệu
  description: {
    type: String,
    default: '',
  }, // Mô tả thương hiệu
  image: {
    type: String,
    default: '',
  }, // URL hoặc đường dẫn ảnh thương hiệu
}, {
  timestamps: true, // Thêm các trường createdAt và updatedAt
});

const Brand = mongoose.model('Brand', BrandSchema);

export default Brand; 