import express from "express";
import Product from "../model/productDb.js";
import { optionalAuth } from "../midddleware/userAuth.js";
import Cart from "../model/CartDb.js";

const cartRouter = express.Router();

// ==============================
// ADD ITEM TO CART
// ==============================
cartRouter.post("/add", optionalAuth, async (req, res) => {
  const { productId, quantity, guestId } = req.body;
  const userId = req.userId;

  if (!productId || !quantity || (!userId && !guestId)) {
    return res.status(400).json({
      message: "productId, quantity, and guestId/userId are required",
    });
  }

  try {
    // ✅ GET PRODUCT FROM DB
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "product not found" });

    const numericPrice = Number(product.price);

    // Check existing cart item
    const existingItem = await Cart.findOne({
      productId,
      userId: userId || null,
      guestId: userId ? null : guestId,
    });

    if (existingItem) {
      existingItem.quantity += Number(quantity);
      existingItem.totalPrice =
        existingItem.quantity * existingItem.unitPrice;

      await existingItem.save();

      return res.status(200).json({
        message: "Cart updated",
        item: existingItem,
      });
    }

    const newCartItem = await Cart.create({
      productId,
      userId: userId || null,
      guestId: userId ? null : guestId,
      quantity: Number(quantity),
      unitPrice: numericPrice,
      totalPrice: Number(quantity) * numericPrice,
    });

    res.status(201).json({
      message: "Item added to cart",
      item: newCartItem,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// GET CART ITEMS (USER)
// ==============================
cartRouter.get("/all", optionalAuth, async (req, res) => {
  const userId = req.userId;
  if (!userId)
    return res.status(401).json({ message: "User not authenticated" });

  try {
    const items = await Cart.find({ userId });

    // ✅ FETCH PRODUCTS FROM DB
    const enrichedItems = await Promise.all(
      items.map(async (c) => {
        const product = await Product.findById(c.productId);

        return {
          ...c._doc,
          name: product?.name || "Unknown Product",
          image: product?.images?.[0] || "",
          unitPrice: product?.price || c.unitPrice,
          totalPrice: c.quantity * (product?.price || c.unitPrice),
        };
      })
    );

    res.status(200).json(enrichedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// GET CART ITEMS (GUEST)
// ==============================
cartRouter.get("/all/guest/:guestId", async (req, res) => {
  const guestId = req.params.guestId;

  try {
    const items = await Cart.find({ guestId });

    const enrichedItems = await Promise.all(
      items.map(async (c) => {
        const product = await Product.findById(c.productId);

        return {
          ...c._doc,
          name: product?.name || "Unknown Product",
          image: product?.images?.[0] || "",
          unitPrice: product?.price || c.unitPrice,
          totalPrice: c.quantity * (product?.price || c.unitPrice),
        };
      })
    );

    res.status(200).json(enrichedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// UPDATE CART ITEM
// ==============================
cartRouter.patch("/edit", async (req, res) => {
  const { cartId, quantity } = req.body;

  if (!cartId || quantity === undefined)
    return res
      .status(400)
      .json({ message: "cartId and quantity required" });

  try {
    const item = await Cart.findById(cartId);
    if (!item)
      return res.status(404).json({ message: "cart item not found" });

    item.quantity = Number(quantity);
    item.totalPrice = item.unitPrice * Number(quantity);

    await item.save();

    res.json({ message: "Cart updated", item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// DELETE CART ITEM
// ==============================
cartRouter.delete("/delete/:id", async (req, res) => {
  try {
    const item = await Cart.findByIdAndDelete(req.params.id);

    if (!item)
      return res.status(404).json({ message: "cart item not found" });

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// MERGE GUEST CART
// ==============================
cartRouter.post("/merge", optionalAuth, async (req, res) => {
  const { guestId } = req.body;
  const userId = req.userId;

  if (!guestId || !userId)
    return res
      .status(400)
      .json({ message: "guestId and userId required" });

  try {
    await Cart.updateMany(
      { guestId },
      { $set: { userId, guestId: null } }
    );

    res.json({ message: "Cart merged successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default cartRouter;