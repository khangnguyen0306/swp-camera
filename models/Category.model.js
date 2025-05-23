import mongoose from 'mongoose';
const { Schema } = mongoose;

const CategorySchema = new Schema({
  name:      { type: String, required: true, unique: true }, // Tên danh mục
  parent:    { type: Schema.Types.ObjectId, ref: 'Category' }, // Danh mục cha (nếu có)
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', CategorySchema);
export default Category;