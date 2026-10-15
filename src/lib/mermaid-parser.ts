import { FlowNode, FlowEdge, NodeType } from "./schema";

export interface MermaidParsedGraph {
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction: "TB" | "LR";
}

/**
 * Parses Mermaid flowchart code into Flowcraft FlowNode and FlowEdge structures.
 * Supports:
 * - flowchart TB / LR / TD / RL
 * - Subroutine [[label]], Database [(label)], Decision {label}, Start/End ([label]), Process [label], Input/Output [/label/]
 * - Directed arrows --> and labeled arrows -->|label| or -- label -->
 */
export function parseMermaidCode(mermaidCode: string): {
  success: boolean;
  graph?: MermaidParsedGraph;
  error?: string;
} {
  try {
    if (!mermaidCode || !mermaidCode.trim()) {
      return { success: false, error: "Mermaid code is empty." };
    }

    const lines = mermaidCode
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    let direction: "TB" | "LR" = "TB";
    let title = "Imported Mermaid Diagram";
    const nodesMap = new Map<string, FlowNode>();
    const edges: FlowEdge[] = [];

    let edgeCounter = 1;

    for (const line of lines) {
      // Header: flowchart TD / graph LR
      if (line.startsWith("flowchart") || line.startsWith("graph")) {
        const parts = line.split(/\s+/);
        const dir = (parts[1] || "").toUpperCase();
        if (dir === "LR" || dir === "RL") {
          direction = "LR";
        } else {
          direction = "TB";
        }
        continue;
      }

      // Title comment %% title
      if (line.startsWith("%%")) {
        const comment = line.replace(/^%%+\s*/, "").trim();
        if (comment) title = comment;
        continue;
      }

      // Check if line contains edge(s)
      // Patterns: A --> B, A([Label]) --> B[Label], A -->|Label| B, A -- Label --> B
      const edgeRegex =
        /([A-Za-z0-9_]+)(?:\[.*?\]|\(.*?\)|>.*?\]|\{.*?\}|\[\(.*?\)\]|\[\/.*?\/\]|\[\[.*?\]\])?\s*(?:(?:-->\s*\|([^|]+)\|\s*)|(?:--\s*([^-]+?)\s*-->)|(?:-->))\s*([A-Za-z0-9_]+)/;
      const edgeMatch = line.match(edgeRegex);

      if (edgeMatch) {
        const sourceId = edgeMatch[1];
        const label = (edgeMatch[2] || edgeMatch[3] || "").trim() || undefined;
        const targetId = edgeMatch[4];

        // Ensure source & target exist in nodesMap
        if (!nodesMap.has(sourceId)) {
          nodesMap.set(sourceId, {
            id: sourceId,
            type: "process",
            label: sourceId,
          });
        }
        if (!nodesMap.has(targetId)) {
          nodesMap.set(targetId, {
            id: targetId,
            type: "process",
            label: targetId,
          });
        }

        edges.push({
          id: `e_${sourceId}_${targetId}_${edgeCounter++}`,
          source: sourceId,
          target: targetId,
          label,
        });
      }

      // Node shape definitions:
      // A(["Start"]) -> start/end
      // B{"Decision?"} -> decision
      // C[("Database")] -> database
      // D[/"I/O"/] -> inputOutput
      // E[["Subprocess"]] -> subprocess
      // F>"Document"] -> document
      // G["Process"] -> process

      const nodeDefs = [
        { type: "database" as const, regex: /([A-Za-z0-9_]+)\s*\[\(\s*["']?([^"'\])]+)["']?\s*\)\]/ },
        { type: "start" as const, regex: /([A-Za-z0-9_]+)\s*\(\[\s*["']?([^"'\])]+)["']?\s*\]\)/ },
        { type: "decision" as const, regex: /([A-Za-z0-9_]+)\s*\{\s*["']?([^"'{}]+)["']?\s*\}/ },
        { type: "inputOutput" as const, regex: /([A-Za-z0-9_]+)\s*\[\/\s*["']?([^"'\]/]+)["']?\s*\/\]/ },
        { type: "subprocess" as const, regex: /([A-Za-z0-9_]+)\s*\[\[\s*["']?([^"'\]]+)["']?\s*\]\]/ },
        { type: "document" as const, regex: /([A-Za-z0-9_]+)\s*>\s*["']?([^"'\]]+)["']?\s*\]/ },
        { type: "process" as const, regex: /([A-Za-z0-9_]+)\s*\[\s*["']?([^"'\]]+)["']?\s*\]/ },
      ];

      for (const def of nodeDefs) {
        const match = line.match(def.regex);
        if (match) {
          const id = match[1];
          const rawLabel = match[2].trim();
          let nodeType: NodeType = def.type;
          if (def.type === "start" && (rawLabel.toLowerCase().includes("end") || rawLabel.toLowerCase().includes("stop"))) {
            nodeType = "end";
          }

          nodesMap.set(id, {
            id,
            type: nodeType,
            label: rawLabel,
          });
          break;
        }
      }
    }

    const nodes = Array.from(nodesMap.values());
    if (nodes.length === 0) {
      return {
        success: false,
        error: "No valid nodes or connections could be parsed from the Mermaid script.",
      };
    }

    return {
      success: true,
      graph: {
        title,
        nodes,
        edges,
        direction,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to parse Mermaid flowchart: ${err instanceof Error ? err.message : "Syntax error"}`,
    };
  }
}
