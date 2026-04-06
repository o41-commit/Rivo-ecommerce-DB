import Product from "../model/productDb.js";
import express from "express";

const goods = express.Router();

// ==============================
// GET ALL PRODUCTS
// ==============================
goods.get("/all", async (req, res) => {
  try {
    const products = await Product.find();

    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No item available yet" });
    }

    res.status(200).json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// GET SINGLE PRODUCT
// ==============================
goods.get("/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(401).json({ message: "Please select an item" });
  }

  try {
    const item = await Product.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error(error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

export default goods;