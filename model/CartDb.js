import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null }, // linked user
    guestId: { type: String, default: null }, // guest session
    productId: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;