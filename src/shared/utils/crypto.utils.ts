import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { Buffer } from "node:buffer";
import config from "../../config/env.ts";

/**
 * Cryptographic utility functions for OTP generation, hashing, and verification.
 */

export const generateOTP = (): string => {
  return randomInt(100000, 1000000).toString();
};

export const hashOTP = (otp: string): string => {
  const secret = process.env.OTP_SECRET || config.jwt.secret;
  return createHmac("sha256", secret)
    .update(otp)
    .digest("hex");
};

export const verifyOTP = (otp: string, storedHash: string): boolean => {
  if (!otp || !storedHash) return false;

  const generatedHash = Buffer.from(hashOTP(otp), "hex");
  const savedHash = Buffer.from(storedHash, "hex");

  return (
    generatedHash.length === savedHash.length &&
    timingSafeEqual(generatedHash, savedHash)
  );
};
