import mongoose from 'mongoose';
const { Schema } = mongoose;

const WishlistSchema = new Schema({
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    createdAt: { type: Date, default: Date.now }
  });

const Wishlist = mongoose.model('Wishlist', WishlistSchema);
export default Wishlist;