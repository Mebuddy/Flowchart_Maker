import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "flowcraft_session";
const SESSION_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days

// ARCHITECTURAL NOTE: This in-memory rate limiting map provides instance-level brute-force mitigation
// designed for single-owner personal deployments. In a multi-instance or serverless environment
// (such as Vercel), serverless functions are ephemeral and isolated. If this application is ever
// converted into a public multi-user SaaS, a distributed shared store (e.g. Upstash Redis / Vercel KV)
// must be integrated to coordinate attempt counters across all serverless instances.
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  // Clean expired
  if (record && now > record.resetAt) {
    loginAttempts.delete(identifier);
  }

  const current = loginAttempts.get(identifier) || { count: 0, resetAt: now + 60 * 1000 };

  if (current.count >= 5) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  current.count += 1;
  loginAttempts.set(identifier, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetLoginRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}

function getSessionSecretKey(): Uint8Array {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) {
    // In dev, fallback to a deterministic fallback if not set, but warn
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: APP_SESSION_SECRET must be configured in production.");
    }
    return new TextEncoder().encode("flowcraft-dev-session-secret-at-least-32-chars-long");
  }
  return new TextEncoder().encode(secret.padEnd(32, "0"));
}

export function isAuthRequired(): boolean {
  const password = process.env.APP_ACCESS_PASSWORD;
  if (process.env.NODE_ENV === "production") {
    return true; // Always strictly require auth in production
  }
  return Boolean(password && password.trim().length > 0);
}

export function isAuthConfigured(): boolean {
  const password = process.env.APP_ACCESS_PASSWORD;
  const secret = process.env.APP_SESSION_SECRET;
  return Boolean(password && secret);
}

export function verifyPassword(providedPassword: string): boolean {
  const configuredPassword = process.env.APP_ACCESS_PASSWORD;
  if (!configuredPassword) {
    // If auth is not configured in local development, accept empty or any
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    return false;
  }

  // Use SHA-256 hash comparison with timingSafeEqual to prevent length and timing leakage
  const hashProvided = crypto.createHash("sha256").update(providedPassword).digest();
  const hashConfigured = crypto.createHash("sha256").update(configuredPassword).digest();

  return crypto.timingSafeEqual(hashProvided, hashConfigured);
}

export async function createSessionToken(): Promise<string> {
  const secretKey = getSessionSecretKey();
  const token = await new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRATION_SECONDS}s`)
    .sign(secretKey);

  return token;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const secretKey = getSessionSecretKey();
    const { payload } = await jwtVerify(token, secretKey);
    return payload.role === "owner";
  } catch {
    return false;
  }
}

export async function validateRequestSession(): Promise<boolean> {
  if (!isAuthRequired()) {
    return true;
  }

  // Fail closed if production environment lacks complete auth configuration
  if (process.env.NODE_ENV === "production" && !isAuthConfigured()) {
    return false;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie || !sessionCookie.value) {
    return false;
  }

  return verifySessionToken(sessionCookie.value);
}
