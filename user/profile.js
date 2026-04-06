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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//  UPDATE USER INFO + IMAGE
profile.patch("/update", upload.any(), async (req, res) => {
  try {
    const id = req.user.id;
    const { num, address, newpassword, oldpassword, confirmPassword, email } = req.body;

    const findUser = await User.findById(id);
    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    
    if (num) findUser.num = num;
    if (address) findUser.address = address;
    if (email) findUser.email = email;

    if (newpassword && oldpassword && confirmPassword) {
      const ismatch = await bcrypt.compare(oldpassword, findUser.password);
      if (!ismatch) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      if (newpassword !== confirmPassword) {
        return res.status(401).json({ message: "New password does not match confirm password" });
      }

      findUser.password = await bcrypt.hash(confirmPassword, 10);
    }

    // Update image
    if (req.files && req.files.length > 0) {
      const imageFile = req.files.find((f) => f.fieldname === "image");
      if (imageFile) findUser.image = imageFile.filename;
    }

    await findUser.save();

    const { password, ...userWithoutPassword } = findUser.toObject();
    res.status(200).json({ message: "User updated successfully", user: userWithoutPassword });
  } catch (error) {
    console.error(error);
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

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default profile;