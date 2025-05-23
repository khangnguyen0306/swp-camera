// models/customer.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const SellerSchema = new Schema({
    accountId:             { type: Schema.Types.ObjectId, ref: 'Auth', required: true, unique: true },
    storeName:             { type: String, required: true },
    storeAddress:          { type: String, required: true },
    storeDescription:      { type: String },
    storeLogoUrl:          { type: String },
    businessLicenseNumber: { type: String, unique: true, sparse: true },
    taxId:                 { type: String, unique: true, sparse: true },
    contactEmail:          { type: String, lowercase: true }, 
    contactPhone:          { type: String },
    bankAccountNumber:     { type: String },
    bankName:              { type: String },
    payoutThreshold:       { type: Number, default: 100 },
    isActive:              { type: Boolean, default: false },
    rating:                { type: Number, default: 0, min: 0, max: 5 },
    createdAt:             { type: Date, default: Date.now },
    updatedAt:             { type: Date, default: Date.now }
  });
  SellerSchema.pre('save', function(next) { this.updatedAt = Date.now(); next(); });

  const Seller = mongoose.model('Seller', SellerSchema);
export default Seller;
