import { NextRequest, NextResponse } from "next/server";
import { validateRequestSession } from "@/lib/auth";
import { generateFlowGraph } from "@/lib/gemini";

export const maxDuration = 60; // Allow sufficient time for LLM generation

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification
    const isAuthenticated = await validateRequestSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Please authenticate to generate flowcharts." },
        { status: 401 }
      );
    }

    // 2. Request payload validation
    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Invalid request payload. 'prompt' string is required." },
        { status: 400 }
      );
    }

    const trimmedPrompt = body.prompt.trim();
    if (trimmedPrompt.length === 0) {
      return NextResponse.json(
        { error: "The description prompt cannot be empty." },
        { status: 400 }
      );
    }

    if (trimmedPrompt.length > 12000) {
      return NextResponse.json(
        {
          error: `The prompt exceeds the maximum limit of 12,000 characters (received ${trimmedPrompt.length} characters).`,
        },
        { status: 400 }
      );
    }

    // 3. AI Generation
    const { graph, validation } = await generateFlowGraph(trimmedPrompt);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "The generated flowchart had critical structural errors that could not be automatically resolved.",
          validation,
          graph,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      graph,
      validation,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
