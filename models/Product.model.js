// models/customer.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const ProductSchema = new Schema({
    // seller:       { type: Schema.Types.ObjectId, ref: 'Seller', required: true }, // Đã xóa vì đây là cửa hàng đơn lẻ
    name:         { type: String, required: true, trim: true }, // Tên sản phẩm
    brand:        { type: Schema.Types.ObjectId, ref: 'Brand', required: true }, // Thương hiệu, đã cập nhật để tham chiếu đến Brand
    origin:       { type: String }, // Xuất xứ
    description:  { type: String, default: '' }, // Mô tả sản phẩm
    price:        { type: Number, required: true, min: 0 }, // Giá bán
    categories:   [{ type: Schema.Types.ObjectId, ref: 'ProductType' }], // Danh mục sản phẩm, đã cập nhật để tham chiếu đến ProductType
    stock:        { type: Number, default: 0, min: 0 }, // Số lượng tồn kho
    images:       { type: [String], default: [] }, // Danh sách link ảnh sản phẩm
    
    // Các trường thông số kỹ thuật camera
    model:        { type: String, required: true }, // Tên/số hiệu mẫu máy
    type:         { type: String }, // Loại máy ảnh (DSLR, Mirrorless, Point and Shoot, Action Camera, v.v.)
    sensorType:   { type: String }, // Loại cảm biến (Full-Frame CMOS, APS-C CMOS, v.v.)
    megapixels:   { type: Number }, // Độ phân giải (Megapixels)
    lensMount:    { type: String }, // Loại ngàm ống kính
    videoResolution: { type: String }, // Độ phân giải video tối đa (4K, 1080p, v.v.)
    connectivity: { type: [String], default: [] }, // Kết nối (Wi-Fi, Bluetooth, USB-C, HDMI, v.v.)
    features:     { type: [String], default: [] }, // Các tính năng nổi bật
    weight:       { type: Number }, // Trọng lượng
    dimensions:   { type: String }, // Kích thước (ví dụ: DxRxC)

    usageInstructions: { type: String }, // Hướng dẫn sử dụng
    certifications: { type: [String], default: [] }, // Chứng nhận (CE, FCC, v.v.)
    warnings:     { type: String }, // Cảnh báo sử dụng
    
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