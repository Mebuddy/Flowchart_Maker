import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { FlowGraph, FlowGraphSchema } from "./schema";
import { validateGraphSemantics, ValidationResult } from "./validation";

const SYSTEM_INSTRUCTION = `You are Flowcraft, an expert systems architect and diagram engineer.
Transform the user's natural-language process description into a rigorous, well-structured flowchart.

Follow these strict rules:
1. Extract the logical sequence of operations from the input.
2. Identify explicit conditions and decisions. Use 'decision' node type for conditionals.
3. Every decision must have distinct, clearly labeled outgoing branches (e.g. "Yes" and "No", "True" and "False", "Success" and "Failure").
4. Accurately assign node types:
   - 'start': Initial entry point or trigger of the workflow.
   - 'end': Terminal endpoint or completion (if workflow concludes).
   - 'process': Standard internal operations, calculations, actions.
   - 'decision': Branches based on evaluated conditions.
   - 'inputOutput': Reading sensors, receiving user inputs, displaying outputs, network I/O.
   - 'subprocess': Predefined subroutines, external service invocations.
   - 'document': Reports, logs, document generation.
   - 'database': Reading or writing to persistent storage, caches, or databases.
5. Accurately represent loops, continuous monitoring loops, retry paths, error handling, and exits. Connect the repeating edge back to the appropriate node.
6. Keep node labels short, readable, and punchy (1 to 6 words). Move longer details, explanations, or notes into the optional 'description' field.
7. Connect edges in a logically consistent direction. Every edge must reference valid, existing source and target node IDs.
8. Avoid duplicating nodes. Merge identical converging flows where logical.
9. Never invent arbitrary business logic or fictitious paths not hinted at in the prompt.
10. If the description is ambiguous or has gaps, record your reasonable assumptions in the 'assumptions' array.
11. Return a clear title and a 1-2 sentence summary of the process.
12. Do NOT provide x/y coordinates; the layout engine handles positioning.`;

export async function generateFlowGraph(prompt: string): Promise<{
  graph: FlowGraph;
  validation: ValidationResult;
}> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error(
      "Google Gemini API key is missing. Please set GOOGLE_GENERATIVE_AI_API_KEY in your environment (.env.local or Vercel)."
    );
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const google = createGoogleGenerativeAI({
    apiKey,
  });

  // 1. Initial generation attempt
  const result = await generateObject({
    model: google(modelName),
    schema: FlowGraphSchema,
    system: SYSTEM_INSTRUCTION,
    prompt: `Generate a complete, structured flowchart diagram for this process:\n\n${prompt}`,
    temperature: 0.2,
  });

  let graph = result.object;
  let validation = validateGraphSemantics(graph);

  // 2. If semantic validation failed with hard errors, perform at most ONE bounded correction attempt
  if (!validation.isValid && validation.errors.length > 0) {
    const errorDetails = validation.errors.map((e) => `- [${e.code}] ${e.message}`).join("\n");
    try {
      const correctionPrompt = `The previous graph generated had the following structural errors:
${errorDetails}

Please fix these exact errors and return a corrected, fully connected graph matching the original process description:
Original description:
${prompt}`;

      const retryResult = await generateObject({
        model: google(modelName),
        schema: FlowGraphSchema,
        system: SYSTEM_INSTRUCTION,
        prompt: correctionPrompt,
        temperature: 0.1,
      });

      const retryValidation = validateGraphSemantics(retryResult.object);
      if (retryValidation.isValid || retryValidation.errors.length < validation.errors.length) {
        graph = retryResult.object;
        validation = retryValidation;
      }
    } catch {
      // If retry fails, preserve the original validation result
    }
  }

  return { graph, validation };
}
