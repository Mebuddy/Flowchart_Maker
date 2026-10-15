import { NextResponse } from "next/server";
import { isAuthRequired, validateRequestSession } from "@/lib/auth";

export async function GET() {
  const authRequired = isAuthRequired();
  const authenticated = await validateRequestSession();

  return NextResponse.json({
    authRequired,
    authenticated,
  });
}
