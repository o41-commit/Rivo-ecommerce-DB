import express from "express";
import Notification from "../model/notificationDb.js";
import PlacedOrder from "../model/PlaceOrder.js";

const confirmOrder = express.Router();

// GET ALL ORDERS (STAFF)
confirmOrder.get("/all", async (req, res) => {
  try {
    const orders = await PlacedOrder.find().sort({ createdAt: -1 });
    return res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// TO GET A SINGLE ORDER
confirmOrder.get("order/:id", async (req, res) => {
  const orderId = req.params.id;
  try {
    if (!orderId) {
      return res
        .status(400)
        .json({ message: "Pls select an order to procced" });
    }

    const findOrder = await PlacedOrder.findById(orderId);

    if (!findOrder) {
      return res.status(404).json({ message: "order not found " });
    }

    res.status(200).json(findOrder)
  } catch (error) {
    res.status(500).json({message: "server error "})
  }
});

// CONFIRM ORDER (PENDING → COMPLETED)
confirmOrder.put("/confirm/:id", async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await PlacedOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending orders can be confirmed",
      });
    }

    order.status = "Confirmed";
    order.approvedAt = new Date();
    await order.save();

    await Notification.create({
      userId: order.userId,
      type: "user",
      title: "Order Approved",
      message:
        "Your order has been approved and will be shipped within five working days",
    });

    return res.status(200).json({
      message: "Order confirmed",
      order,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// SHIP ORDER (COMPLETED → SHIPPED)
confirmOrder.put("/approve/:id", async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await PlacedOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Confirmed") {
      return res.status(400).json({
        message: "Only confirmed orders can be shipped",
      });
    }

    order.status = "Delivered";
    order.approvedAt = new Date();
    await order.save();

    await Notification.create({
      userId: order.userId,
      type: "user",
      title: "Order Shipped",
      message: "Your order has been shipped successfully",
    });

    return res.status(200).json({
      message: "Order shipped",
      order,
    });
  } catch (error) {
    console.error(error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

export default confirmOrder;
