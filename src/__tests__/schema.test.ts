import { describe, it, expect } from "vitest";
import { FlowGraphSchema, FlowProjectSchema, NodeTypeSchema } from "../lib/schema";

describe("Schema Validation Tests", () => {
  it("validates supported node types", () => {
    const validTypes = [
      "start",
      "end",
      "process",
      "decision",
      "inputOutput",
      "subprocess",
      "document",
      "database",
    ];

    for (const t of validTypes) {
      expect(NodeTypeSchema.safeParse(t).success).toBe(true);
    }

    expect(NodeTypeSchema.safeParse("unknown_type").success).toBe(false);
  });

  it("validates valid flow graph structure", () => {
    const validGraph = {
      title: "Sample Loop",
      summary: "A continuous loop diagram",
      assumptions: ["Assumes loop repeats"],
      nodes: [
        { id: "n1", type: "start", label: "Start" },
        { id: "n2", type: "process", label: "Read Sensor", description: "Sensor pin A0" },
      ],
      edges: [{ id: "e1", source: "n1", target: "n2", label: "Next" }],
    };

    const res = FlowGraphSchema.safeParse(validGraph);
    expect(res.success).toBe(true);
  });

  it("rejects graph with missing required fields", () => {
    const invalidGraph = {
      summary: "Missing title",
      nodes: [],
      edges: [],
    };

    const res = FlowGraphSchema.safeParse(invalidGraph);
    expect(res.success).toBe(false);
  });

  it("validates flow project schema with position coordinates", () => {
    const project = {
      version: 1,
      id: "proj_123",
      title: "Test Project",
      summary: "Project summary",
      assumptions: [],
      originalPrompt: "Test prompt",
      layoutDirection: "TB",
      nodes: [
        { id: "n1", type: "start", label: "Start", position: { x: 100, y: 100 } },
      ],
      edges: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const res = FlowProjectSchema.safeParse(project);
    expect(res.success).toBe(true);
  });
});
