import express from "express";
import Cart from "../model/CartDb.js";
import PlacedOrder from "../model/PlaceOrder.js";
import Notification from "../model/notificationDb.js";

const order = express.Router();

// GET CURRENT USER CART
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

// CREATE ORDER
order.post("/create", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  const { cartItemIds } = req.body;

  try {
    let selectedItems = await Cart.find({ userId });

    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
      selectedItems = selectedItems.filter((item) =>
        cartItemIds.includes(item._id.toString())
      );
    }

    if (selectedItems.length === 0) {
      return res
        .status(400)
        .json({ message: "No cart item selected for order" });
    }

    const totalPrice = selectedItems.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );

    const newOrder = await PlacedOrder.create({
      userId,
      items: selectedItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalPrice,
      status: "Pending",
    });

    // ✅ REMOVE ITEMS FROM CART
    await Cart.deleteMany({
      _id: { $in: selectedItems.map((item) => item._id) },
    });

    // ✅ CREATE NOTIFICATION (DB)
    await Notification.create({
      userId,
      type: "user",
      title: "Order Placed",
      message: "Order created successfully",
    });

    return res.status(201).json({
      success: true,
      message: "Order created",
      order: newOrder,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// GET USER ORDERS
// ==============================
order.get("/my", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const userOrders = await PlacedOrder.find({ userId });
    return res.status(200).json({ userId, orders: userOrders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// GET SINGLE ORDER
// ==============================
order.get("/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const orderItem = await PlacedOrder.findOne({
      _id: req.params.id,
      userId,
    });

    if (!orderItem)
      return res.status(404).json({ message: "Order not found" });

    return res.status(200).json(orderItem);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// DELETE ORDER
// ==============================
order.delete("/delete/:id", async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const orderItem = await PlacedOrder.findOne({
      _id: req.params.id,
      userId,
    });



    if (!orderItem)
      return res.status(404).json({ message: "Order not found" });

    if (orderItem.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending orders can be deleted",
      });
    }

    await PlacedOrder.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default order;