import mongoose from 'mongoose';
const { Schema } = mongoose;

const BannerSchema = new Schema({
  imageUrl:   { type: String, required: true },
  link:       { type: String },
  title:      { type: String },
  startDate:  { type: Date },
  endDate:    { type: Date },
  createdAt:  { type: Date, default: Date.now }
});

const Banner = mongoose.model('Banner', BannerSchema);
export default Banner;