import * as crypto from "crypto";

const PBKDF2_SALT = "visionsupersalt"; // Standard salt for consistency in local database

/**
 * Hashes a plaintext password securely using PBKDF2 and a fixed salt.
 * Native crypto library is used to avoid external dependencies.
 */
export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, PBKDF2_SALT, 1000, 64, "sha512").toString("hex");
}

/**
 * Compares a plaintext password with a hashed password.
 */
export function verifyPassword(password: string, hash: string): boolean {
  const inputHash = hashPassword(password);
  return crypto.timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(hash, "hex"));
}
