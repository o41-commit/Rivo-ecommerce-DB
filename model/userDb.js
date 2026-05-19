// models/userDb.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  // 🔥 FIX: must NOT be required for Google users
  password: {
    type: String,
    default: null,
  },

  role: {
    type: String,
    enum: ["user", "staff", "admin"],
    default: "user",
  },

  authProvider: {
    type: String,
    enum: ["email", "google"],
    default: "email",
  },

  num: {
    type: String,
    default: null,
  },

  address: {
    type: Array,
    default: [],
  },

  image: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

export default User;