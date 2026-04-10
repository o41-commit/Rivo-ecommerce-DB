import express from "express";
import { v4 as uuidv4 } from "uuid";
import upload from "./uploads.js";
import Product from "../model/productDb.js";
import "../config/cloudinary.js";

const item = express.Router();

// CREATE PRODUCT
item.post("/create", upload.array("images", 5), async (req, res) => {
  const { name, price, description, category, size, colors } = req.body;

  if (!name || !price || !description || !category) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  try {
    // Cloudinary replaces local file URLs
    const images = req.files.map((file) => file.path);

    const newProduct = new Product({
      id: uuidv4(),
      name,
      price,
      description,
      category,
      size: size ? size.split(",") : [],
      colors: colors ? colors.split(",") : [],
      images,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("CREATE_PRODUCT_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET ALL PRODUCTS
item.get("/items", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    console.error("GET_ALL_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET SINGLE PRODUCT
item.get("/item/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("GET_ONE_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE PRODUCT
item.put("/item/edit/:id", async (req, res) => {
  try {
    const { name, price, description, category, size, colors } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (description) product.description = description;
    if (category) product.category = category;
    if (size) product.size = size.split(",");
    if (colors) product.colors = colors.split(",");

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("UPDATE_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE PRODUCT
item.delete("/delete/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default item;