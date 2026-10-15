import { NextRequest, NextResponse } from "next/server";
import {
  checkLoginRateLimit,
  resetLoginRateLimit,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  isAuthConfigured,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown-ip";
    const rateCheck = checkLoginRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { password } = body;

    if (process.env.NODE_ENV === "production" && !isAuthConfigured()) {
      return NextResponse.json(
        { error: "Server configuration incomplete. APP_ACCESS_PASSWORD and APP_SESSION_SECRET must be set." },
        { status: 500 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }

    const isValid = verifyPassword(password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }

    // Success
    resetLoginRateLimit(ip);
    const token = await createSessionToken();

    const response = NextResponse.json({ success: true, message: "Authenticated successfully." });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
