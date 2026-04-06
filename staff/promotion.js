import express from "express";
import { v4 as uuidv4 } from "uuid";
import Promotion from "../model/promotionDb.js";

const promotion = express.Router();

// CREATE PROMOTION
promotion.post("/create", async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  try {
    const promo = new Promotion({
      title,
      message,
      type: "promotion"
    });

    await promo.save();

    return res.status(201).json({
      success: true,
      message: "Promotion created",
      promo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// DELETE PROMOTION
promotion.delete("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPromo = await Promotion.findByIdAndDelete(id);

    if (!deletedPromo) {
      return res.status(404).json({ message: "Promotion not found or already deleted" });
    }

    return res.status(200).json({
      success: true,
      message: "Promotion deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET ALL PROMOTIONS
promotion.get("/all", async (req, res) => {
  try {
    const promotions = await Promotion.find({ type: "promotion" });

    if (promotions.length === 0)
      return res.status(404).json({ message: "No promotions found" });

    return res.status(200).json(promotions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

export default promotion;