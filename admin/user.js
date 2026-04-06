import express from "express";
import User from "../model/userDb.js";

const user = express.Router();

// ==============================
// GET ALL USERS
// ==============================
user.get("/allusers", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // remove password

    if (!users.length) {
      return res.status(404).json({ message: "No user found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// TURN USER TO STAFF
// ==============================
user.patch("/update/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(401).json({ message: "Pls select a user" });
  }

  try {
    const findUser = await User.findById(id);

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    findUser.role = "staff";
    await findUser.save();

    res.status(200).json({
      success: true,
      message: "User turned to staff successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// DISABLE STAFF (BACK TO USER)
// ==============================
user.patch("/disable/:id", async (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(401).json({ message: "Pls select a user" });
  }

  try {
    const findUser = await User.findById(id);

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    findUser.role = "user";
    await findUser.save();

    res.status(200).json({
      success: true,
      message: "Staff turned to user successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default user;