import { describe, it, expect } from "vitest";
import { parseMermaidCode } from "../lib/mermaid-parser";
import { FlowGraphSchema, FlowProjectSchema } from "../lib/schema";
import { DIAGRAM_PRESETS } from "../lib/presets";

describe("Mermaid Parser", () => {
  it("parses graph direction and node types accurately", () => {
    const mermaid = `
    flowchart TD
      A([Start Process]) --> B[Step 1]
      B --> C{Is Valid?}
      C -->|Yes| D[/Output Result/]
      C -->|No| E[(Database Store)]
      E --> F>Document Log]
      F --> G([Stop Process])
    `;

    const res = parseMermaidCode(mermaid);
    expect(res.success).toBe(true);
    expect(res.graph).toBeDefined();
    const parsed = res.graph!;
    expect(parsed.direction).toBe("TB");
    expect(parsed.nodes.length).toBe(7);
    expect(parsed.edges.length).toBe(6);

    const startNode = parsed.nodes.find((n) => n.id === "A");
    expect(startNode?.type).toBe("start");
    expect(startNode?.label).toBe("Start Process");

    const decisionNode = parsed.nodes.find((n) => n.id === "C");
    expect(decisionNode?.type).toBe("decision");
    expect(decisionNode?.label).toBe("Is Valid?");

    const dbNode = parsed.nodes.find((n) => n.id === "E");
    expect(dbNode?.type).toBe("database");

    const stopNode = parsed.nodes.find((n) => n.id === "G");
    expect(stopNode?.type).toBe("end");

    const yesEdge = parsed.edges.find((e) => e.source === "C" && e.target === "D");
    expect(yesEdge?.label).toBe("Yes");
  });

  it("handles empty or invalid mermaid content gracefully without throwing", () => {
    const result = parseMermaidCode("invalid gibberish text");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("Presets & Visual Customization", () => {
  it("provides valid style definitions for all six presets", () => {
    const presetKeys = [
      "default",
      "minimal-light",
      "dark-technical",
      "presentation",
      "monochrome",
      "soft-professional",
    ] as const;

    for (const key of presetKeys) {
      const preset = DIAGRAM_PRESETS[key];
      expect(preset).toBeDefined();
      expect(preset.name).toBeTypeOf("string");
      expect(preset.canvasBg.dark).toBeTypeOf("string");
      expect(preset.canvasBg.light).toBeTypeOf("string");
      expect(preset.types.process).toBeDefined();
      expect(preset.types.decision).toBeDefined();
    }
  });

  it("validates project schema with new presets and edge routing", () => {
    const project = {
      version: 2,
      id: "test-proj",
      title: "Test Project",
      summary: "A test project",
      assumptions: [],
      originalPrompt: "test",
      layoutDirection: "TB",
      preset: "dark-technical",
      nodes: [
        {
          id: "n1",
          type: "process",
          label: "Process Node",
          position: { x: 100, y: 100 },
          style: {
            fillColor: "#1e293b",
            borderColor: "#3b82f6",
            borderWidth: 2,
            textColor: "#f8fafc",
            fontSize: 14,
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "n1",
          target: "n1",
          routing: "step",
          label: "Loop",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = FlowProjectSchema.safeParse(project);
    expect(parsed.success).toBe(true);
  });
});
