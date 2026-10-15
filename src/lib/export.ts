import { toPng, toSvg } from "html-to-image";
import { FlowProject, FlowProjectSchema, FlowNode, FlowEdge } from "./schema";

export function generateMermaid(
  title: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: "TB" | "LR" = "TB"
): string {
  const dir = direction === "LR" ? "LR" : "TD";
  const lines: string[] = [`flowchart ${dir}`, `  %% ${title}`];

  // Node declarations with proper Mermaid shapes
  for (const node of nodes) {
    const safeLabel = node.label.replace(/"/g, '\\"');
    let shape = `["${safeLabel}"]`; // default process [ ]

    switch (node.type) {
      case "start":
      case "end":
        shape = `(["${safeLabel}"])`; // rounded pill
        break;
      case "decision":
        shape = `{"${safeLabel}"}`; // diamond
        break;
      case "inputOutput":
        shape = `[/"${safeLabel}"/]`; // parallelogram
        break;
      case "subprocess":
        shape = `[["${safeLabel}"]]`; // subprocess
        break;
      case "document":
        shape = `>"${safeLabel}"]`; // document
        break;
      case "database":
        shape = `[("${safeLabel}")]`; // cylinder
        break;
      case "process":
      default:
        shape = `["${safeLabel}"]`;
        break;
    }

    lines.push(`  ${node.id}${shape}`);
  }

  // Edge declarations
  for (const edge of edges) {
    if (edge.label && edge.label.trim()) {
      const safeEdgeLabel = edge.label.replace(/"/g, '\\"');
      lines.push(`  ${edge.source} -->|"${safeEdgeLabel}"| ${edge.target}`);
    } else {
      lines.push(`  ${edge.source} --> ${edge.target}`);
    }
  }

  return lines.join("\n");
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function exportProjectToJson(project: FlowProject) {
  const jsonStr = JSON.stringify(project, null, 2);
  const filename = `${project.title.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "flowcraft_project"}.json`;
  downloadFile(jsonStr, filename, "application/json");
}

export function exportProjectToMermaid(project: FlowProject) {
  const mmdStr = generateMermaid(project.title, project.nodes, project.edges, project.layoutDirection);
  const filename = `${project.title.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "flowcraft_diagram"}.mmd`;
  downloadFile(mmdStr, filename, "text/vnd.mermaid");
}

export function shouldExcludeFromExport(node: HTMLElement): boolean {
  if (!node.classList) return false;
  return (
    node.classList.contains("flowcraft-exclude-export") ||
    node.classList.contains("react-flow__panel") ||
    node.classList.contains("react-flow__controls") ||
    node.classList.contains("react-flow__minimap")
  );
}

export async function exportCanvasToImage(
  element: HTMLElement,
  format: "png" | "svg",
  title: string,
  backgroundColor: string = "#0B0F19"
): Promise<void> {
  const filename = `${title.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "flowcraft_diagram"}.${format}`;

  // Filter out editor overlays, selection controls, and minimap using dedicated selector
  const filter = (node: HTMLElement) => {
    return !shouldExcludeFromExport(node);
  };

  if (format === "png") {
    const dataUrl = await toPng(element, {
      pixelRatio: 2, // High resolution
      backgroundColor,
      filter: filter as (domNode: Node) => boolean,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    const dataUrl = await toSvg(element, {
      backgroundColor,
      filter: filter as (domNode: Node) => boolean,
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export function parseAndValidateImport(jsonContent: string): {
  success: boolean;
  project?: FlowProject;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonContent);
    const result = FlowProjectSchema.safeParse(parsed);
    if (!result.success) {
      const issue = result.error.issues[0];
      return {
        success: false,
        error: `Invalid project file format: ${issue?.path.join(".")} - ${issue?.message}`,
      };
    }
    return {
      success: true,
      project: result.data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: `Failed to parse JSON file: ${err instanceof Error ? err.message : "Malformed syntax"}`,
    };
  }
}
