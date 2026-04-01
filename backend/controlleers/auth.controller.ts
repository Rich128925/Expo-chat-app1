import { Request, Response } from "express";
import User from "../modals/User";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/token";

export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password, name, avatar } = req.body || {};

    if (!email || !password || !name) {
      res
        .status(400)
        .json({ success: false, msg: "Email, password and name are required" });
      return;
    }

    let user = await User.findOne({ email });

    if (user) {
      res.status(400).json({ success: false, msg: "User already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      name,
      avatar: avatar || "",
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      token,
    });
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

export const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res
        .status(400)
        .json({ success: false, msg: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(400).json({ success: false, msg: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ success: false, msg: "Invalid credentials" });
      return;
    }

    const token = generateToken(user);

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.log("error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};