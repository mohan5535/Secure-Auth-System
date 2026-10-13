import jwt from "jsonwebtoken";
import crypto from "crypto";

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters");
  }

  return secret;
};

export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    { sub: userId },
    getJwtSecret(),
    { expiresIn: "1h" }
  );
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};