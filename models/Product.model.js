// models/customer.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProductSchema = new Schema({
    seller:       { type: Schema.Types.ObjectId, ref: 'Seller', required: true }, // Người bán
    name:         { type: String, required: true, trim: true }, // Tên sản phẩm
    brand:        { type: String, required: true }, // Thương hiệu
    // origin:       { type: String }, // Xuất xứ
    description:  { type: String, default: '' }, // Mô tả sản phẩm
    price:        { type: Number, required: true, min: 0 }, // Giá bán
    categories:   { type: [String], default: [] }, // Danh mục sản phẩm
    stock:        { type: Number, default: 0, min: 0 }, // Số lượng tồn kho
    images:       { type: [String], default: [] }, // Danh sách link ảnh sản phẩm
    volume:       { type: String }, // Dung tích/Khối lượng (ví dụ: 50ml, 100g)
    ingredients:  { type: [String], default: [] }, // Thành phần
    skinType:     { type: [String], default: [] }, // Loại da phù hợp
    expiryDate:   { type: Date }, // Hạn sử dụng
    manufactureDate: { type: Date }, // Ngày sản xuất
    usageInstructions: { type: String }, // Hướng dẫn sử dụng
    preservation: { type: String }, // Cách bảo quản
    certifications: { type: [String], default: [] }, // Chứng nhận (FDA, Organic...)
    warnings:     { type: String }, // Cảnh báo sử dụng
    isVegan:      { type: Boolean, default: false }, // Có thuần chay không 
    rating:       { type: Number, default: 0, min: 0, max: 5 }, // Điểm đánh giá trung bình
    reviews:      [{ type: Schema.Types.ObjectId, ref: 'Review' }], // Danh sách review
    createdAt:    { type: Date, default: Date.now }, // Thời gian tạo
    updatedAt:    { type: Date, default: Date.now }, // Thời gian cập nhật
    availabilityType: {
      type: String,
      enum: ['in_stock', 'pre_order'],
      default: 'in_stock'
    }, // Trạng thái: có sẵn hoặc đặt hàng trước
    preOrderDeliveryTime: { type: String }, // Thời gian giao hàng dự kiến nếu là pre-order
  });
  ProductSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });


  const Product = mongoose.model('Product', ProductSchema);
  export default Product;