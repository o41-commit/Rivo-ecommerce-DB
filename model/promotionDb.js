import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "promotion", 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Promotion = mongoose.model("Promotion", promotionSchema);

export default Promotion;