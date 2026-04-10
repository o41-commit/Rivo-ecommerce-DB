// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

// Routes
import login from "./routes/login.js";
import item from "./staff/Product.js";
import goods from "./routes/items.js";
import { roleAuth } from "./midddleware/staffAuth.js";
import user from "./admin/user.js";
import profile from "./user/profile.js";
import cartRouter from "./routes/chart.js";
import alert from "./user/alert.js";
import order from "./user/order.js";
import promotion from "./staff/promotion.js";
import confirmOrder from "./staff/confirmOrder.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGO_URI) 
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "https://rivocommerce.netlify.app",
  }),
);

// Routes
// Auth
app.use("/auth", login);

// Products (staff/admin)
app.use("/product", roleAuth(["staff", "admin"]), item);

// Profile (user)
app.use("/profile", roleAuth(["user"]), profile);

// Users (admin)
app.use("/user", roleAuth(["admin"]), user);

// Cart
app.use("/cart", cartRouter);

// Orders (user)
app.use("/order", roleAuth(["user"]), order);

// Promotions (staff/admin)
app.use("/promotion", roleAuth(["staff", "admin"]), promotion);

// Confirm Orders (staff/admin)
app.use("/staff/confirm-order", roleAuth(["staff", "admin"]), confirmOrder);

// Notifications (user)
app.use("/notification", roleAuth(["user"]), alert);

// Items (all users)
app.use("/items", goods);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// Start server
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));