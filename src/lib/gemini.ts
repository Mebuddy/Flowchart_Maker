import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { FlowGraph, FlowGraphSchema } from "./schema";
import { validateGraphSemantics, ValidationResult } from "./validation";
import { classifyGeminiError, calculateBackoffDelay, sleep } from "./gemini-retry";

const SYSTEM_INSTRUCTION = `You are Flowcraft, an expert systems architect and diagram engineer.
Transform the user's process description into a rigorous, well-structured flowchart.

Follow these strict rules:
1. Extract the logical sequence of operations from the input.
2. Identify explicit conditions and decisions using the 'decision' node type.
3. Every decision node must have distinct, clearly labeled outgoing branches (e.g. "Yes" and "No", "True" and "False", "Success" and "Failure").
4. Accurately assign node types:
   - 'start': Initial entry point or workflow trigger.
   - 'end': Terminal endpoint or completion.
   - 'process': Standard operations, computations, actions.
   - 'decision': Branches based on evaluated conditions.
   - 'inputOutput': Reading sensors, user inputs, displays, network I/O.
   - 'subprocess': Predefined subroutines, external services.
   - 'document': Reports, logs, document generation.
   - 'database': Reading/writing to storage, caches, or DBs.
5. Accurately represent loops, monitoring cycles, retry paths, and error handling. Connect edges back to the appropriate node.
6. Keep node labels short and punchy (1 to 6 words). Move longer notes into the optional 'description' field.
7. Connect edges in a logically consistent direction with valid source and target node IDs.
8. Avoid duplicating nodes; merge converging flows where logical.
9. Return a clear title and a 1-2 sentence summary of the process.
10. Do NOT provide x/y coordinates; layout engine handles positioning.`;

export class GeminiOverloadError extends Error {
  public readonly isOverload = true;
  public readonly retryable = true;
  public readonly retryAfterSeconds?: number;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "GeminiOverloadError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

interface ExecuteAttemptOptions {
  modelName: string;
  google: ReturnType<typeof createGoogleGenerativeAI>;
  prompt: string;
  attemptTimeoutMs?: number;
}

async function executeModelGeneration({
  modelName,
  google,
  prompt,
  attemptTimeoutMs = 15000,
}: ExecuteAttemptOptions): Promise<FlowGraph> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), attemptTimeoutMs);

  try {
    const result = await generateObject({
      model: google(modelName),
      schema: FlowGraphSchema,
      system: SYSTEM_INSTRUCTION,
      prompt: `Generate a complete flowchart diagram for this process:\n\n${prompt}`,
      temperature: 0.2,
      maxRetries: 0, // Disable internal SDK nested retries so outer policy has strict control
      abortSignal: controller.signal,
    });

    let graph = result.object;
    const validation = validateGraphSemantics(graph);

    // If semantic validation failed with hard errors, perform at most ONE bounded correction attempt
    if (!validation.isValid && validation.errors.length > 0) {
      const errorDetails = validation.errors.map((e) => `- [${e.code}] ${e.message}`).join("\n");
      try {
        const correctionController = new AbortController();
        const correctionTimer = setTimeout(() => correctionController.abort(), 10000);

        const correctionPrompt = `The previous graph had structural errors:
${errorDetails}

Please fix these exact errors and return a corrected, fully connected graph:
Process:
${prompt}`;

        const retryResult = await generateObject({
          model: google(modelName),
          schema: FlowGraphSchema,
          system: SYSTEM_INSTRUCTION,
          prompt: correctionPrompt,
          temperature: 0.1,
          maxRetries: 0,
          abortSignal: correctionController.signal,
        });

        clearTimeout(correctionTimer);

        const retryValidation = validateGraphSemantics(retryResult.object);
        if (retryValidation.isValid || retryValidation.errors.length < validation.errors.length) {
          graph = retryResult.object;
        }
      } catch {
        // Preserve initial graph if correction throws or times out
      }
    }

    return graph;
  } finally {
    clearTimeout(timer);
  }
}

export interface GenerationMetrics {
  totalDurationMs: number;
  attempts: Array<{
    attemptNumber: number;
    model: string;
    durationMs: number;
    success: boolean;
    errorReason?: string;
  }>;
  usedFallbackModel: boolean;
  retryCount: number;
  cumulativeRetryDelayMs: number;
}

export async function generateFlowGraph(prompt: string): Promise<{
  graph: FlowGraph;
  validation: ValidationResult;
  usedFallbackModel?: boolean;
  metrics?: GenerationMetrics;
}> {
  const startTime = performance.now();
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "Google Gemini API key is missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment (.env.local or Vercel)."
    );
  }

  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

  const google = createGoogleGenerativeAI({
    apiKey,
  });

  // Strict global execution budget to stay safely within Vercel's 60s timeout
  const GLOBAL_TIMEOUT_MS = 40000;
  const ATTEMPT_TIMEOUT_MS = 15000;
  const MAX_PRIMARY_RETRIES = 2; // Up to 3 attempts total on primary (0, 1, 2)

  const metrics: GenerationMetrics = {
    totalDurationMs: 0,
    attempts: [],
    usedFallbackModel: false,
    retryCount: 0,
    cumulativeRetryDelayMs: 0,
  };

  let lastClassification = classifyGeminiError(null);

  // 1. Try Primary Model with bounded exponential backoff & jitter
  for (let attempt = 0; attempt <= MAX_PRIMARY_RETRIES; attempt++) {
    const elapsedSoFar = performance.now() - startTime;
    if (elapsedSoFar >= GLOBAL_TIMEOUT_MS) {
      break;
    }

    const attemptStart = performance.now();
    try {
      const graph = await executeModelGeneration({
        modelName: primaryModel,
        google,
        prompt,
        attemptTimeoutMs: Math.min(ATTEMPT_TIMEOUT_MS, Math.max(GLOBAL_TIMEOUT_MS - elapsedSoFar, 3000)),
      });

      const attemptDuration = performance.now() - attemptStart;
      metrics.attempts.push({
        attemptNumber: attempt + 1,
        model: primaryModel,
        durationMs: Math.round(attemptDuration),
        success: true,
      });

      const validation = validateGraphSemantics(graph);
      metrics.totalDurationMs = Math.round(performance.now() - startTime);

      return { graph, validation, usedFallbackModel: false, metrics };
    } catch (err: unknown) {
      const attemptDuration = performance.now() - attemptStart;
      const classification = classifyGeminiError(err);
      lastClassification = classification;

      metrics.attempts.push({
        attemptNumber: attempt + 1,
        model: primaryModel,
        durationMs: Math.round(attemptDuration),
        success: false,
        errorReason: classification.reason,
      });

      // Do NOT retry permanent errors (invalid keys, missing model, bad request)
      if (classification.isPermanent || !classification.isTransient) {
        const rawMsg = err instanceof Error ? err.message : String(err);
        const sanitized = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]");
        throw new Error(sanitized);
      }

      // If daily quota is exhausted (hours-long delay), immediate primary retries won't succeed.
      // Jump directly to fallback model instead of wasting backoff cycles!
      if (
        classification.retryAfterMs && classification.retryAfterMs > 60000 ||
        classification.reason.includes("Daily model quota")
      ) {
        break;
      }

      // If we still have attempts left on primary model, check budget before backoff sleep
      if (attempt < MAX_PRIMARY_RETRIES) {
        const remainingBudget = GLOBAL_TIMEOUT_MS - (performance.now() - startTime);
        if (remainingBudget <= 5000) {
          break; // Insufficient time for another primary attempt + fallback
        }

        const delay = calculateBackoffDelay(attempt, classification.retryAfterMs);
        metrics.retryCount++;
        metrics.cumulativeRetryDelayMs += delay;
        await sleep(Math.min(delay, remainingBudget - 3000));
      }
    }
  }

  // 2. If Primary Model encountered transient overload / quota limit, attempt Fallback Model
  const timeBeforeFallback = performance.now() - startTime;
  if (
    fallbackModel &&
    fallbackModel.trim() !== "" &&
    fallbackModel !== primaryModel &&
    timeBeforeFallback < GLOBAL_TIMEOUT_MS - 4000
  ) {
    const fallbackStart = performance.now();
    try {
      const fallbackGraph = await executeModelGeneration({
        modelName: fallbackModel,
        google,
        prompt,
        attemptTimeoutMs: Math.min(ATTEMPT_TIMEOUT_MS, GLOBAL_TIMEOUT_MS - timeBeforeFallback),
      });

      const fallbackDuration = performance.now() - fallbackStart;
      metrics.attempts.push({
        attemptNumber: metrics.attempts.length + 1,
        model: fallbackModel,
        durationMs: Math.round(fallbackDuration),
        success: true,
      });

      metrics.usedFallbackModel = true;
      metrics.totalDurationMs = Math.round(performance.now() - startTime);

      const validation = validateGraphSemantics(fallbackGraph);
      const graphWithNote: FlowGraph = {
        ...fallbackGraph,
        assumptions: [
          ...fallbackGraph.assumptions,
          `Generated using fallback model '${fallbackModel}' due to high demand on primary model '${primaryModel}'.`,
        ],
      };

      return {
        graph: graphWithNote,
        validation,
        usedFallbackModel: true,
        metrics,
      };
    } catch (fallbackErr: unknown) {
      const fallbackDuration = performance.now() - fallbackStart;
      const fallbackClassification = classifyGeminiError(fallbackErr);

      metrics.attempts.push({
        attemptNumber: metrics.attempts.length + 1,
        model: fallbackModel,
        durationMs: Math.round(fallbackDuration),
        success: false,
        errorReason: fallbackClassification.reason,
      });

      if (fallbackClassification.isPermanent) {
        const rawMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        const sanitized = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]");
        throw new Error(sanitized);
      }
    }
  }

  metrics.totalDurationMs = Math.round(performance.now() - startTime);

  // 3. Retry exhausted: Provide clear user-facing overload guidance
  const retryAfterSec = lastClassification.retryAfterMs
    ? Math.min(Math.ceil(lastClassification.retryAfterMs / 1000), 300)
    : undefined;

  throw new GeminiOverloadError(
    `The Gemini model ('${primaryModel}') is currently experiencing temporary high demand. Spikes in demand are usually brief. Please try again shortly.`,
    retryAfterSec
  );
}
