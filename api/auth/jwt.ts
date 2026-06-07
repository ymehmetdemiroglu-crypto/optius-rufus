import { sign, verify } from "hono/jwt";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me-in-production";

export interface JWTPayload {
  userId: string;
  role: string;
  exp: number;
  [key: string]: unknown;
}

export async function signToken(userId: string, role = "admin"): Promise<string> {
  const payload: JWTPayload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
  };
  try {
    return await sign(payload, JWT_SECRET);
  } catch (err) {
    throw new Error("Failed to sign JWT token", { cause: err });
  }
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    return (await verify(token, JWT_SECRET, "HS256")) as unknown as JWTPayload;
  } catch (err) {
    throw new Error("Invalid or expired JWT token", { cause: err });
  }
}
