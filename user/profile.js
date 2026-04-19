import express from "express";
import User from "../model/userDb.js";
import upload from "../midddleware/image.js";
import bcrypt from "bcryptjs";

const profile = express.Router();


profile.get("/info", async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("GET_USER_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


profile.patch("/update", upload.single("image"), async (req, res) => {
  try {
    const id = req.user.id;

    const {
      num,
      address,
      email,
      newpassword,
      oldpassword,
      confirmPassword,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (num) user.num = num;
    if (address) user.address = address;
    if (email) user.email = email;

    if (newpassword && oldpassword && confirmPassword) {
      const isMatch = await bcrypt.compare(oldpassword, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      if (newpassword !== confirmPassword) {
        return res.status(400).json({
          message: "Password confirmation mismatch",
        });
      }

      user.password = await bcrypt.hash(newpassword, 10);
    }

    if (req.file) {
      user.image = req.file.path; // Cloudinary URL or file path
    }

    await user.save();

    const { password, ...safeUser } = user.toObject();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("UPDATE_USER_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});


profile.delete("/delete", async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_USER_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default profile;