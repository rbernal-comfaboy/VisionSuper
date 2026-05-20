import { cookies } from "next/headers";
import * as crypto from "crypto";

const SESSION_COOKIE_NAME = "visionsuper_session";
// Fallback key for encryption (should ideally be changed in production via env var)
const SESSION_SECRET = process.env.SESSION_SECRET || "c8942b083c21a4f005b823e5902187b9264fa5e2a22f3e829d10e527f311c19b";

const ALGORITHM = "aes-256-cbc";
const KEY = crypto.scryptSync(SESSION_SECRET, "salt", 32);

interface SessionPayload {
  userId: number;
  email: string;
  role: string;
  areaId: number | null;
  name: string;
}

// Encrypt payload to a secure token
function encrypt(data: SessionPayload): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// Decrypt secure token back to payload
function decrypt(token: string): SessionPayload | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("❌ Error al desencriptar sesión:", error);
    return null;
  }
}

// Set session cookie
export async function createSession(data: SessionPayload) {
  const token = encrypt(data);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 Horas de sesión laboral
  });
}

// Get session from cookies
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie || !cookie.value) return null;
  return decrypt(cookie.value);
}

// Destroy session cookie
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
