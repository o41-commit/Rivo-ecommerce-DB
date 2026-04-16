import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: String,
  price: Number,
  quantity: Number,
  totalPrice: Number,
  size: [String],
  colors: [String],
  image: String,
});

const placedOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    userNum: {
      type: Number,
      required: true,
      ref: "User",
    },
    userAddress: {
      type: String,
      required: true,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
      ref: "User",
    },
    userName: {
      type: String,
      required: true,
      ref: "User",
    },
    items: [orderItemSchema],
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Canceled"],
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,

    toJSON: {
      transform: function (doc, ret) {
        if (ret.createdAt) {
          ret.createdAt = new Date(ret.createdAt).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            }
          );
        }
        return ret;
      },
    },

    toObject: {
      transform: function (doc, ret) {
        if (ret.createdAt) {
          ret.createdAt = new Date(ret.createdAt).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            }
          );
        }
        return ret;
      },
    },
  }
);

const PlacedOrder = mongoose.model("PlacedOrder", placedOrderSchema);

export default PlacedOrder;