import mongoose from 'mongoose';
const { Schema } = mongoose;

const AddressSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String },
  postalCode: { type: String },
  country: { type: String },
  isDefault: { type: Boolean, default: false }
});

const Address = mongoose.model('Address', AddressSchema);
export default Address;
