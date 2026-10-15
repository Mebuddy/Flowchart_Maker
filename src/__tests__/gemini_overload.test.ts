import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  classifyGeminiError,
  calculateBackoffDelay,
} from "../lib/gemini-retry";
import { GeminiOverloadError } from "../lib/gemini";

describe("Gemini Overload and Error Classification Tests", () => {
  it("identifies HTTP 503 UNAVAILABLE as transient overload", () => {
    const error503 = {
      statusCode: 503,
      message: "The service is temporarily unavailable.",
    };

    const classification = classifyGeminiError(error503);
    expect(classification.isTransient).toBe(true);
    expect(classification.isOverload).toBe(true);
    expect(classification.isPermanent).toBe(false);
  });

  it("identifies high-demand temporary overload messages", () => {
    const highDemandError = new Error(
      "Failed after 3 attempts. Last error: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later."
    );

    const classification = classifyGeminiError(highDemandError);
    expect(classification.isTransient).toBe(true);
    expect(classification.isOverload).toBe(true);
    expect(classification.isPermanent).toBe(false);
  });

  it("parses Retry-After headers and message hints correctly", () => {
    const headersMock = new Map<string, string>();
    headersMock.set("retry-after", "4.5");

    const errorWithHeader = {
      statusCode: 429,
      responseHeaders: headersMock,
      message: "Resource exhausted",
    };

    const c1 = classifyGeminiError(errorWithHeader);
    expect(c1.retryAfterMs).toBe(4500);

    const errorWithMessage = new Error("Quota exceeded. Please retry after 3 seconds.");
    const c2 = classifyGeminiError(errorWithMessage);
    expect(c2.retryAfterMs).toBe(3000);
  });

  it("identifies permanent configuration errors and does not mark them as transient", () => {
    const invalidKey = new Error("API key not valid. Please pass a valid API key.");
    const c1 = classifyGeminiError(invalidKey);
    expect(c1.isPermanent).toBe(true);
    expect(c1.isTransient).toBe(false);

    const missingModel = {
      statusCode: 404,
      message: "models/unsupported-model is not found.",
    };
    const c2 = classifyGeminiError(missingModel);
    expect(c2.isPermanent).toBe(true);
    expect(c2.isTransient).toBe(false);

    const badRequest = {
      statusCode: 400,
      message: "INVALID_ARGUMENT: Schema constraint violated",
    };
    const c3 = classifyGeminiError(badRequest);
    expect(c3.isPermanent).toBe(true);
    expect(c3.isTransient).toBe(false);
  });
});

describe("Exponential Backoff and Jitter Calculation Tests", () => {
  it("calculates exponential delays with jitter within expected bounds", () => {
    // Attempt 0: ~1000ms + 0-500ms jitter -> 1000..1500ms
    const d0 = calculateBackoffDelay(0);
    expect(d0).toBeGreaterThanOrEqual(1000);
    expect(d0).toBeLessThanOrEqual(1550);

    // Attempt 1: ~2000ms + 0-500ms jitter -> 2000..2500ms
    const d1 = calculateBackoffDelay(1);
    expect(d1).toBeGreaterThanOrEqual(2000);
    expect(d1).toBeLessThanOrEqual(2550);

    // Attempt 2: ~4000ms + 0-500ms jitter -> 4000..4500ms
    const d2 = calculateBackoffDelay(2);
    expect(d2).toBeGreaterThanOrEqual(4000);
    expect(d2).toBeLessThanOrEqual(4550);
  });

  it("respects Retry-After when provided", () => {
    const delay = calculateBackoffDelay(0, 3500);
    expect(delay).toBe(3500);
  });

  it("caps delay at maxDelayMs to protect Vercel execution limits", () => {
    const delay = calculateBackoffDelay(10, undefined, 1000, 8000);
    expect(delay).toBeLessThanOrEqual(8000);
  });
});

describe("GeminiOverloadError and Retry Strategy Behavior Tests", () => {
  it("creates structured GeminiOverloadError with retryable metadata", () => {
    const err = new GeminiOverloadError("Model overloaded", 5);
    expect(err.isOverload).toBe(true);
    expect(err.retryable).toBe(true);
    expect(err.retryAfterSeconds).toBe(5);
    expect(err.message).toContain("Model overloaded");
  });

  it("configures GEMINI_FALLBACK_MODEL and distinguishes from GEMINI_MODEL", () => {
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";

    expect(process.env.GEMINI_MODEL).toBe("gemini-3.8-flash");
    expect(process.env.GEMINI_FALLBACK_MODEL).toBe("gemini-2.5-flash");
    expect(process.env.GEMINI_MODEL).not.toBe(process.env.GEMINI_FALLBACK_MODEL);
  });

  it("identifies daily quota exhaustion as fast-path fallback eligible", () => {
    const quotaExhaustedError = new Error(
      "You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.8-flash. Please retry in 7h29m48s."
    );
    const classification = classifyGeminiError(quotaExhaustedError);
    expect(classification.isTransient).toBe(true);
    expect(classification.isOverload).toBe(true);
    expect(classification.reason).toContain("Daily model quota has been exhausted");
  });
});

