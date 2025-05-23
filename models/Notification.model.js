import mongoose from 'mongoose';
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  user:      { type: Schema.Types.ObjectId, ref: 'Customer' }, // hoặc Seller
  message:   { type: String, required: true },
  isRead:    { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;