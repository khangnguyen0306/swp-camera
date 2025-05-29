import mongoose from "mongoose";
const { Schema } = mongoose;

const ComboSchema = new Schema({
  name: { type: String, required: true },
  products: [{ type: Schema.Types.ObjectId, ref: "Product", required: true }],
  area: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  comboType: {
    type: String,
    required: true,
    enum: ["basic", "premium", "family"],
    default: "basic"
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "Auth" },
  createdAt: { type: Date, default: Date.now }
});

const Combo = mongoose.model("Combo", ComboSchema);
export default Combo; 