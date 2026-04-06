import express from "express";
import User from "../model/userDb.js";
import Notification from "../model/notificationDb.js";
import Promotion from "../model/promotionDb.js";

const alert = express.Router();

// ================= GET ALL NOTIFICATIONS =================
alert.get("/all", async (req, res) => {
  const userId = req.user.id;

  try {
    const findUser = await User.findById(userId);
    if (!findUser) {
      return res.status(400).json({ message: "User not found" });
    }

    // 1️⃣ Get user notifications
    const userNotifications = await Notification.find({
      type: "user",
      userId,
    }).sort({ createdAt: -1 });

    // 2️⃣ Get all global promotions
    const promotions = await Promotion.find().sort({ createdAt: -1 });

    // 3️⃣ Combine notifications and promotions
    const allNotifications = [
      ...promotions.map((p) => ({
        _id: p._id,
        type: "promotion",
        title: p.title,
        message: p.message,
        createdAt: p.createdAt,
      })),
      ...userNotifications.map((n) => ({
        _id: n._id,
        type: "user",
        message: n.message,
        createdAt: n.createdAt,
      })),
    ].sort((a, b) => b.createdAt - a.createdAt); // sort newest first

    return res.status(200).json(allNotifications);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ================= DELETE NOTIFICATION =================
alert.delete("/delete/:id", async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const noti = await Notification.findById(id);

    if (!noti) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // 🔐 Only owner can delete user notifications
    if (noti.type === "user" && noti.userId.toString() !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this notification",
      });
    }

    await Notification.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error(error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid notification ID" });
    }

    return res.status(500).json({ message: "Server error" });
  }
});

export default alert;