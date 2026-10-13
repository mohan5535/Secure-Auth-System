import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/token";
import type { AuthRequest } from "../middleware/authMiddleware";

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
      return;
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      res.status(400).json({
        success: false,
        message: "Name must contain 2–100 characters"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: "Enter a valid email address"
      });
      return;
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and at most 72 UTF-8 bytes"
      });
      return;
    }

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      verificationTokenHash,
      verificationTokenExpires: new Date(Date.now() + 15 * 60 * 1000)
    });

    // Temporary development-only output.
    // The raw token is not returned in the API response.
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `DEV EMAIL VERIFICATION TOKEN for ${user.email}: ${verificationToken}`
      );
    }

    res.status(201).json({
      success: true,
      message: "Registration successful. Verify your email to activate your account."
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists"
      });
      return;
    }

    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to register user"
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email before logging in"
      });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to log in"
    });
  }
};
export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select(
      "name email isVerified createdAt"
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve profile"
    });
  }
};
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const token = req.params.token;

    if (!token || typeof token !== "string") {
      res.status(400).json({
        success: false,
        message: "Verification token is required"
      });
      return;
    }

    const verificationTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      verificationTokenHash,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification token"
      });
      return;
    }

    user.isVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });
  } catch (error) {
    console.error("Email verification error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to verify email"
    });
  }
};
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    // Return the same response whether or not the account exists.
    const successResponse = {
      success: true,
      message: "If an account exists, password reset instructions will be provided."
    };

    if (typeof email !== "string") {
      res.status(200).json(successResponse);
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user) {
      res.status(200).json(successResponse);
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    // Development only: use a real email provider in production.
    if (process.env.NODE_ENV !== "production") {
      console.log(`DEV PASSWORD RESET TOKEN for ${user.email}: ${resetToken}`);
    }

    res.status(200).json(successResponse);
  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to process password reset request"
    });
  }
};
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (
      typeof token !== "string" ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      res.status(400).json({
        success: false,
        message: "A valid token and a password of 8–72 UTF-8 bytes are required"
      });
      return;
    }

    const resetTokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetTokenHash,
      resetTokenExpires: { $gt: new Date() }
    }).select("+password");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
      return;
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in with your new password."
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to reset password"
    });
  }
};