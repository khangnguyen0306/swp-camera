import mongoose from 'mongoose';
const { Schema } = mongoose;

const ReportSchema = new Schema({
  seller:        { type: Schema.Types.ObjectId, ref: 'Seller', required: true }, // Chủ shop/seller
  periodType:    { type: String, enum: ['day', 'week', 'month', 'year', 'custom'], required: true }, // Loại kỳ báo cáo
  periodStart:   { type: Date, required: true }, // Ngày bắt đầu kỳ báo cáo
  periodEnd:     { type: Date, required: true }, // Ngày kết thúc kỳ báo cáo

  // Tổng quan đơn hàng & doanh thu
  totalOrders:      { type: Number, default: 0 }, // Tổng số đơn hàng
  totalRevenue:     { type: Number, default: 0 }, // Tổng doanh thu (đã thanh toán)
  totalProducts:    { type: Number, default: 0 }, // Tổng số sản phẩm đã bán
  totalCustomers:   { type: Number, default: 0 }, // Số khách hàng mua hàng trong kỳ

  // Trạng thái đơn hàng
  ordersPending:    { type: Number, default: 0 }, // Đơn chờ xử lý
  ordersProcessing: { type: Number, default: 0 }, // Đơn đang xử lý
  ordersShipped:    { type: Number, default: 0 }, // Đơn đã gửi đi
  ordersDelivered:  { type: Number, default: 0 }, // Đơn đã giao
  ordersCancelled:  { type: Number, default: 0 }, // Đơn đã hủy
  ordersRefunded:   { type: Number, default: 0 }, // Đơn hoàn tiền
  ordersReturned:   { type: Number, default: 0 }, // Đơn trả hàng

  // Doanh thu theo ngày (nếu kỳ báo cáo là tuần/tháng/năm)
  dailyRevenue: [
    {
      date:   { type: Date },
      amount: { type: Number, default: 0 }
    }
  ],

  // Sản phẩm bán chạy (top N)
  bestSellers: [
    {
      product:   { type: Schema.Types.ObjectId, ref: 'Product' },
      name:      { type: String },
      quantity:  { type: Number },
      revenue:   { type: Number }
    }
  ],

  // Sản phẩm bị trả hàng nhiều nhất
  mostReturnedProducts: [
    {
      product:   { type: Schema.Types.ObjectId, ref: 'Product' },
      name:      { type: String },
      returnCount: { type: Number }
    }
  ],

  // Thống kê khách hàng
  newCustomers:    { type: Number, default: 0 }, // Số khách hàng mới trong kỳ
  repeatCustomers: { type: Number, default: 0 }, // Số khách hàng mua lặp lại

  // Thống kê sản phẩm
  totalProductsListed: { type: Number, default: 0 }, // Tổng số sản phẩm đang bán
  totalProductsOutOfStock: { type: Number, default: 0 }, // Sản phẩm hết hàng

  // Thống kê lượt xem sản phẩm (nếu có tracking)
  totalProductViews: { type: Number, default: 0 },

  // Lợi nhuận, chi phí, thuế
  totalProfit:      { type: Number, default: 0 },
  totalCost:        { type: Number, default: 0 },
  totalTax:         { type: Number, default: 0 },

  // Ghi chú, nhận xét, cảnh báo (nếu có)
  notes:            { type: String },

  createdAt:        { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', ReportSchema);
export default Report;