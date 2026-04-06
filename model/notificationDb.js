import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = global (promotion)
    },
    type: {
      type: String,
      enum: ["user", "promotion"],
      default: "user",
    },
    title: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;