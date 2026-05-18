import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../model/userDb.js";
import admin from "../config/firebaseAdmin.js";


dotenv.config();

const login = express.Router();



// REGISTER
login.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      authProvider: "email",
      address: null,
      num: null,
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      role: newUser.role,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});



// GOOGLE LOGIN
login.post("/google", async (req, res) => {

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Token required",
    });
  }

  try {

    // verify firebase token
    const decodedToken = await admin
      .auth()
      .verifyIdToken(token);

    const { email, name } = decodedToken;

    // check existing user
    let existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    // create user if not existing
    if (!existingUser) {

      existingUser = new User({
        name,
        email: email.toLowerCase(),
        password: null,
        role: "user",
        authProvider: "google",
        address: null,
        num: null,
      });

      await existingUser.save();
    }

    // create jwt
    const appToken = jwt.sign(
      {
        id: existingUser._id,
        role: existingUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      success: true,
      message: "Google login successful",
      token: appToken,
      role: existingUser.role,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Google authentication failed",
    });
  }
});



// NORMAL LOGIN
login.post("/login", async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password required",
    });
  }

  try {

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!existingUser) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // google account check
    if (!existingUser.password) {
      return res.status(400).json({
        message: "Please login with Google",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    const token = jwt.sign(
      {
        id: existingUser._id,
        role: existingUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      role: existingUser.role,
      token,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
});



export default login;