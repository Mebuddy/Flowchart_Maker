import { NextRequest, NextResponse } from "next/server";
import { validateRequestSession } from "@/lib/auth";
import { generateFlowGraph, GeminiOverloadError } from "@/lib/gemini";

export const maxDuration = 60; // Allow sufficient time for LLM generation

// Active generation requests tracker to prevent concurrent duplicate generation
const activePrompts = new Set<string>();

export async function POST(req: NextRequest) {
  let promptKey = "";

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

    // 3. Concurrency check: prevent identical concurrent in-flight requests
    promptKey = trimmedPrompt.substring(0, 100);
    if (activePrompts.has(promptKey)) {
      return NextResponse.json(
        {
          error: "A flowchart generation for this prompt is already in progress. Please wait for it to finish.",
          isConcurrentDuplicate: true,
        },
        { status: 429 }
      );
    }
    activePrompts.add(promptKey);

    // 4. AI Generation with bounded retry, backoff, and fallback
    const { graph, validation, usedFallbackModel, metrics } = await generateFlowGraph(trimmedPrompt);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Flowcraft API] Generated in ${metrics?.totalDurationMs ?? "?"}ms | Retries: ${metrics?.retryCount ?? 0} | Fallback: ${Boolean(usedFallbackModel)} | Nodes: ${graph.nodes.length} | Edges: ${graph.edges.length}`
      );
    }

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: "The generated flowchart had critical structural errors that could not be automatically resolved.",
          validation,
          graph,
          metrics,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      graph,
      validation,
      usedFallbackModel: Boolean(usedFallbackModel),
      metrics,
    });
  } catch (err: unknown) {
    if (err instanceof GeminiOverloadError) {
      return NextResponse.json(
        {
          error: err.message,
          isOverload: true,
          retryable: true,
          retryAfter: err.retryAfterSeconds,
        },
        { status: 503 }
      );
    }

    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return NextResponse.json(
      { error: message, isOverload: false, retryable: false },
      { status: 500 }
    );
  } finally {
    if (promptKey) {
      activePrompts.delete(promptKey);
    }
  }
}
