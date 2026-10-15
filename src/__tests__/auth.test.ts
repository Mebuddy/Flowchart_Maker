import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  checkLoginRateLimit,
  resetLoginRateLimit,
} from "../lib/auth";

describe("Authentication & Security Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("verifies password correctly with constant-time equality", () => {
    process.env.APP_ACCESS_PASSWORD = "SuperSecretPassword123!";

    expect(verifyPassword("SuperSecretPassword123!")).toBe(true);
    expect(verifyPassword("WrongPassword")).toBe(false);
    expect(verifyPassword("SuperSecretPassword123")).toBe(false);
  });

  it("generates and verifies signed session tokens", async () => {
    process.env.APP_SESSION_SECRET = "01234567890123456789012345678901";

    const token = await createSessionToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const isValid = await verifySessionToken(token);
    expect(isValid).toBe(true);

    const isInvalid = await verifySessionToken("tampered.token.payload");
    expect(isInvalid).toBe(false);
  });

  it("enforces login rate limiting on repeated failures", () => {
    const testIp = "test-rate-limit-ip";
    resetLoginRateLimit(testIp);

    // First 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      const res = checkLoginRateLimit(testIp);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt blocked
    const blockedRes = checkLoginRateLimit(testIp);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);

    // Reset works
    resetLoginRateLimit(testIp);
    expect(checkLoginRateLimit(testIp).allowed).toBe(true);
  });
});
