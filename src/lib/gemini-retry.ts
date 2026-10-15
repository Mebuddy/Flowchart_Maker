export interface ErrorClassification {
  isTransient: boolean;
  isOverload: boolean;
  isPermanent: boolean;
  retryAfterMs?: number;
  reason: string;
}

/**
 * Classifies an error from Google Gemini / AI SDK into transient (overload/503/429) vs permanent.
 * Respects Retry-After headers or error messages where available.
 */
export function classifyGeminiError(error: unknown): ErrorClassification {
  if (!error) {
    return {
      isTransient: false,
      isOverload: false,
      isPermanent: false,
      reason: "Unknown error",
    };
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  const msg = rawMessage.toLowerCase();

  // Extract HTTP status code if present on the error object
  const anyErr = error as { statusCode?: number; status?: number; responseHeaders?: Headers };
  const statusCode = anyErr.statusCode || anyErr.status;

  // 1. Permanent Configuration Errors - DO NOT RETRY
  const isInvalidKey =
    statusCode === 401 ||
    statusCode === 403 ||
    msg.includes("api key") ||
    msg.includes("permission_denied") ||
    msg.includes("api_key_invalid");

  const isUnsupportedModel =
    statusCode === 404 ||
    (msg.includes("models/") && (msg.includes("not found") || msg.includes("is not supported") || msg.includes("404")));

  const isBadRequest =
    statusCode === 400 ||
    msg.includes("invalid_argument") ||
    msg.includes("invalid argument");

  if (isInvalidKey) {
    return {
      isTransient: false,
      isOverload: false,
      isPermanent: true,
      reason: "Invalid or unauthorized API key.",
    };
  }

  if (isUnsupportedModel) {
    return {
      isTransient: false,
      isOverload: false,
      isPermanent: true,
      reason: "Configured Gemini model ID was not found or is unsupported.",
    };
  }

  if (isBadRequest) {
    return {
      isTransient: false,
      isOverload: false,
      isPermanent: true,
      reason: "Malformed request or invalid arguments.",
    };
  }

  // 2. Parse Retry-After if provided in headers or message
  let retryAfterMs: number | undefined;

  if (anyErr.responseHeaders?.get) {
    const headerVal = anyErr.responseHeaders.get("retry-after");
    if (headerVal) {
      const parsedSeconds = parseFloat(headerVal);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        retryAfterMs = parsedSeconds * 1000;
      }
    }
  }

  if (!retryAfterMs) {
    // Check for "retry after X s/seconds" in error message
    const match = rawMessage.match(/(?:retry[ -]after|try again in|please wait)[\s:]*(\d+(?:\.\d+)?)\s*(s|sec|seconds|ms)?/i);
    if (match) {
      const val = parseFloat(match[1]);
      const unit = (match[2] || "s").toLowerCase();
      if (!isNaN(val) && val > 0) {
        retryAfterMs = unit === "ms" ? val : val * 1000;
      }
    }
  }

  // 3. Transient Overload / Rate Limit / 503 / 429
  const is503Unavailable = statusCode === 503 || msg.includes("503") || msg.includes("unavailable");
  const is429RateLimit =
    statusCode === 429 ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("quota");
  const isHighDemand =
    msg.includes("high demand") ||
    msg.includes("spikes in demand") ||
    msg.includes("overload") ||
    msg.includes("temporarily unavailable") ||
    msg.includes("try again later");

  // Detect long quota exhaustion (e.g. daily quota exceeded with hours of delay requested)
  // If a quota error explicitly specifies hours or days, or retryAfter exceeds 60s, retrying within this request is futile.
  const isLongQuotaExhaustion =
    is429RateLimit &&
    (msg.includes("perday") ||
     msg.includes("free_tier_requests") ||
     /retry in \d+h/i.test(rawMessage) ||
     (retryAfterMs !== undefined && retryAfterMs > 60000));

  if (isLongQuotaExhaustion) {
    return {
      isTransient: true,
      isOverload: true,
      isPermanent: false,
      retryAfterMs,
      reason: "Daily model quota has been exhausted. Immediate in-request retries will not succeed; try fallback model.",
    };
  }

  if (is503Unavailable || is429RateLimit || isHighDemand || retryAfterMs !== undefined) {
    return {
      isTransient: true,
      isOverload: true,
      isPermanent: false,
      retryAfterMs,
      reason: "The Gemini model is currently experiencing high demand or temporary unavailability.",
    };
  }

  // Fallback: check network timeouts or connection resets
  const isNetworkTransient =
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("fetch failed") ||
    msg.includes("network error");

  if (isNetworkTransient) {
    return {
      isTransient: true,
      isOverload: false,
      isPermanent: false,
      retryAfterMs,
      reason: "Temporary network connection issue.",
    };
  }

  return {
    isTransient: false,
    isOverload: false,
    isPermanent: false,
    reason: rawMessage,
  };
}

/**
 * Calculates exponential backoff delay with jitter.
 * Delays roughly scale:
 * Attempt 0: ~1000ms (+ 0-500ms jitter)
 * Attempt 1: ~2000ms (+ 0-500ms jitter)
 * Attempt 2: ~4000ms (+ 0-500ms jitter)
 */
export function calculateBackoffDelay(
  attemptIndex: number,
  retryAfterMs?: number,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 8000
): number {
  if (retryAfterMs !== undefined && retryAfterMs > 0) {
    // Respect Retry-After but cap at maxDelayMs so serverless requests do not time out
    return Math.min(Math.max(retryAfterMs, 500), maxDelayMs);
  }

  const exponentialDelay = baseDelayMs * Math.pow(2, attemptIndex);
  const jitter = Math.random() * 500; // 0-500ms jitter
  const calculated = exponentialDelay + jitter;

  return Math.min(calculated, maxDelayMs);
}

/**
 * Helper to pause execution
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
