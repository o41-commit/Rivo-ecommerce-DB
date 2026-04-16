import express from "express";
import mongoose from "mongoose";
import Cart from "../model/CartDb.js";
import PlacedOrder from "../model/PlaceOrder.js";
import Notification from "../model/notificationDb.js";
import User from "../model/userDb.js";

const order = express.Router();

/**
 * GET CURRENT USER CART
 */
order.get("/cart", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const items = await Cart.find({ userId });

    const totalPrice = items.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );

    return res.status(200).json({
      userId,
      status: "active",
      totalPrice,
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CREATE ORDER
 */
order.post("/create", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { cartItemIds } = req.body;

  // Validate cartItemIds
  if (cartItemIds && !Array.isArray(cartItemIds)) {
    return res.status(400).json({ message: "Invalid cartItemIds" });
  }

  try {
    const findUser = await User.findById(userId);

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate user profile
    if (!findUser.address || !findUser.num) {
      return res.status(400).json({
        message: "User profile incomplete",
      });
    }

    // Build query (OPTIMIZED)
    let query = { userId };

    if (cartItemIds && cartItemIds.length > 0) {
      const validIds = cartItemIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );

      query._id = { $in: validIds };
    }

    const selectedItems = await Cart.find(query);

    if (selectedItems.length === 0) {
      return res.status(400).json({
        message: "No cart item selected for order",
      });
    }

    const totalPrice = selectedItems.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );

    // START TRANSACTION
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const newOrder = await PlacedOrder.create(
        [
          {
            userId,
            userAddress: findUser.address,
            userNum: findUser.num,
            userName: findUser.name,
            userEmail: findUser.email,
            items: selectedItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.unitPrice,
              totalPrice: item.totalPrice,
              size: item.size,
              colors: item.colors,
              image: item.image,
            })),
            totalPrice,
            status: "Pending",
          },
        ],
        { session }
      );

      await Cart.deleteMany(
        {
          _id: { $in: selectedItems.map((item) => item._id) },
        },
        { session }
      );

      await Notification.create(
        [
          {
            userId,
            type: "user",
            title: "Order Placed",
            message: "Order created successfully",
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json({
        success: true,
        message: "Order created",
        order: newOrder[0],
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET USER ORDERS (WITH PAGINATION)
 */
order.get("/my", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;

    const orders = await PlacedOrder.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await PlacedOrder.countDocuments({ userId });

    return res.status(200).json({
      userId,
      page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
      orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET SINGLE ORDER
 */
order.get("/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const orderItem = await PlacedOrder.findOne({
      _id: id,
      userId,
    });

    if (!orderItem) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(orderItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE ORDER
 */
order.delete("/delete/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const orderItem = await PlacedOrder.findOne({
      _id: id,
      userId,
    });

    if (!orderItem) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (orderItem.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending orders can be deleted",
      });
    }

    await PlacedOrder.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default order;