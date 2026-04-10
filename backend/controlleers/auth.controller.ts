import { Request, Response } from "express";
import User from "../modals/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (user: any) => {
  return jwt.sign(
    {
      userId: user._id,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || ""
      }
    },
    process.env.JWT_SECRET || "secretkey123",
    { expiresIn: "7d" }
  );
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("📝 Register request body:", req.body);
    
    const { email, password, name, avatar } = req.body;

    // Validate
    if (!email || !password || !name) {
      res.status(400).json({ 
        success: false, 
        msg: "Email, password and name are required" 
      });
      return;
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      res.status(400).json({ 
        success: false, 
        msg: "User already exists" 
      });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      avatar: avatar || "",
    });

    await user.save();
    console.log("✅ User created:", user._id);

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ 
      success: false, 
      msg: "Server error during registration" 
    });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("🔐 Login request body:", req.body);
    
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      res.status(400).json({ 
        success: false, 
        msg: "Email and password are required" 
      });
      return;
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("❌ User not found:", email);
      res.status(400).json({ 
        success: false, 
        msg: "Invalid credentials" 
      });
      return;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", email);
      res.status(400).json({ 
        success: false, 
        msg: "Invalid credentials" 
      });
      return;
    }

    // Generate token
    const token = generateToken(user);
    console.log("✅ Login successful:", email);

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ 
      success: false, 
      msg: "Server error during login" 
    });
  }
};