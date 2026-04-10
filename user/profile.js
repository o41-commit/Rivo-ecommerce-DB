import express from "express";
import User from "../model/userDb.js";
import upload from "../midddleware/image.js";
import bcrypt from "bcryptjs";

const profile = express.Router();

  //  GET USER INFO
profile.get("/info", async (req, res) => {
  try {
    const id = req.user.id;

    const findUser = await User.findById(id).select("-password");

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(findUser);
  } catch (error) {
    console.error("GET_USER_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

  //  UPDATE USER INFO + IMAGE
profile.patch("/update", upload.any(), async (req, res) => {
  try {
    const id = req.user.id;

    const {
      num,
      address,
      newpassword,
      oldpassword,
      confirmPassword,
      email,
    } = req.body;

    const findUser = await User.findById(id);

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (num) findUser.num = num;
    if (address) findUser.address = address;
    if (email) findUser.email = email;

    if (newpassword || oldpassword || confirmPassword) {
      const isMatch = await bcrypt.compare(oldpassword, findUser.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      if (newpassword !== confirmPassword) {
        return res.status(401).json({
          message: "Password confirmation mismatch",
        });
      }

      findUser.password = await bcrypt.hash(newpassword, 10);
    }

    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find((f) => f.fieldname === "image");

      if (imageFile) {
        findUser.image = imageFile.path;
      }
    }

    await findUser.save();

    const { password, ...safeUser } = findUser.toObject();

    res.status(200).json({
      message: "User updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("UPDATE_USER_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

  //  DELETE ACCOUNT
profile.delete("/delete", async (req, res) => {
  try {
    const id = req.user.id;

    const findUser = await User.findById(id);

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("DELETE_USER_ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default profile;