import { describe, it, expect } from "vitest";
import { generateMermaid, parseAndValidateImport } from "../lib/export";
import { FlowNode, FlowEdge } from "../lib/schema";

describe("Export and Import Utilities Tests", () => {
  it("generates correct Mermaid flowchart syntax for diverse node shapes", () => {
    const nodes: FlowNode[] = [
      { id: "start", type: "start", label: "Start Flow" },
      { id: "decision", type: "decision", label: "Check Condition" },
      { id: "io", type: "inputOutput", label: "Read Input" },
      { id: "db", type: "database", label: "Save to DB" },
      { id: "doc", type: "document", label: "Generate Report" },
      { id: "sub", type: "subprocess", label: "Call Subroutine" },
      { id: "end", type: "end", label: "End Flow" },
    ];

    const edges: FlowEdge[] = [
      { id: "e1", source: "start", target: "decision" },
      { id: "e2", source: "decision", target: "io", label: "Yes" },
      { id: "e3", source: "decision", target: "db", label: "No" },
    ];

    const mermaid = generateMermaid("Test Flow", nodes, edges, "TB");

    expect(mermaid).toContain("flowchart TD");
    expect(mermaid).toContain('start(["Start Flow"])');
    expect(mermaid).toContain('decision{"Check Condition"}');
    expect(mermaid).toContain('io[/"Read Input"/]');
    expect(mermaid).toContain('db[("Save to DB")]');
    expect(mermaid).toContain('doc>"Generate Report"]');
    expect(mermaid).toContain('sub[["Call Subroutine"]]');
    expect(mermaid).toContain('end(["End Flow"])');
    expect(mermaid).toContain('decision -->|"Yes"| io');
    expect(mermaid).toContain('decision -->|"No"| db');
  });

  it("parses and validates valid project JSON import", () => {
    const validJson = JSON.stringify({
      version: 1,
      id: "import_test",
      title: "Imported Flowchart",
      summary: "Imported successfully",
      assumptions: [],
      originalPrompt: "Prompt",
      layoutDirection: "TB",
      nodes: [
        {
          id: "n1",
          type: "start",
          label: "Start",
          position: { x: 50, y: 50 },
        },
      ],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    const result = parseAndValidateImport(validJson);
    expect(result.success).toBe(true);
    expect(result.project?.title).toBe("Imported Flowchart");
  });

  it("rejects corrupted or schema-violating JSON import", () => {
    const invalidJson = "{ corrupted json content }";
    const res1 = parseAndValidateImport(invalidJson);
    expect(res1.success).toBe(false);
    expect(res1.error).toContain("Failed to parse JSON");

    const schemaViolationJson = JSON.stringify({
      version: 99, // unsupported version
      title: "",
    });
    const res2 = parseAndValidateImport(schemaViolationJson);
    expect(res2.success).toBe(false);
    expect(res2.error).toContain("Invalid project file format");
  });

  it("filters editor controls while preserving decision branch labels in exports", async () => {
    const { shouldExcludeFromExport } = await import("../lib/export");

    // Mock DOM elements
    const toolbarEl = { classList: { contains: (c: string) => c === "flowcraft-exclude-export" } } as unknown as HTMLElement;
    const controlsEl = { classList: { contains: (c: string) => c === "react-flow__controls" } } as unknown as HTMLElement;
    const minimapEl = { classList: { contains: (c: string) => c === "react-flow__minimap" } } as unknown as HTMLElement;
    const edgeLabelEl = { classList: { contains: (c: string) => c === "nodrag-ui" } } as unknown as HTMLElement;
    const nodeEl = { classList: { contains: (c: string) => c === "custom-flow-node" } } as unknown as HTMLElement;

    // Controls must be excluded
    expect(shouldExcludeFromExport(toolbarEl)).toBe(true);
    expect(shouldExcludeFromExport(controlsEl)).toBe(true);
    expect(shouldExcludeFromExport(minimapEl)).toBe(true);

    // Edge labels and nodes must NOT be excluded
    expect(shouldExcludeFromExport(edgeLabelEl)).toBe(false);
    expect(shouldExcludeFromExport(nodeEl)).toBe(false);
  });
});
