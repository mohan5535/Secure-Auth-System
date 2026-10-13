import { Router } from "express";

import {
  register,
  login,
  getProfile,
  verifyEmail,
  forgotPassword,
  resetPassword
} from "../controllers/authController";

import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/profile", authenticate, getProfile);

export default router;