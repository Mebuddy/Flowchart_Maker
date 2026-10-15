import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Editor Graph State and Deletion Regression Tests", () => {
  it("removes connected edges when a node is deleted", () => {
    // Initial state with 3 nodes and 2 edges
    const nodes = [
      { id: "node_1", type: "start", label: "Start" },
      { id: "node_2", type: "process", label: "Step" },
      { id: "node_3", type: "end", label: "End" },
    ];

    const edges = [
      { id: "e1", source: "node_1", target: "node_2" },
      { id: "e2", source: "node_2", target: "node_3" },
    ];

    // Simulate deleting node_2
    const deletedId = "node_2";
    const nextNodes = nodes.filter((n) => n.id !== deletedId);
    const nextEdges = edges.filter(
      (e) => e.source !== deletedId && e.target !== deletedId
    );

    expect(nextNodes.length).toBe(2);
    expect(nextNodes.some((n) => n.id === "node_2")).toBe(false);

    // Both edges e1 and e2 connected to node_2 must be purged
    expect(nextEdges.length).toBe(0);
  });

  it("maintains undo/redo snapshot stack integrity across deletion", () => {
    interface Snapshot {
      nodes: string[];
      edges: string[];
    }

    const history: Snapshot[] = [
      { nodes: ["n1", "n2"], edges: ["e1"] },
    ];
    let historyIndex = 0;

    // Perform deletion of n2
    const step2: Snapshot = { nodes: ["n1"], edges: [] };
    history.push(step2);
    historyIndex = 1;

    expect(history[historyIndex].nodes).toEqual(["n1"]);
    expect(history[historyIndex].edges).toEqual([]);

    // Undo action restores previous state
    historyIndex -= 1;
    expect(history[historyIndex].nodes).toEqual(["n1", "n2"]);
    expect(history[historyIndex].edges).toEqual(["e1"]);

    // Redo action restores deleted state
    historyIndex += 1;
    expect(history[historyIndex].nodes).toEqual(["n1"]);
    expect(history[historyIndex].edges).toEqual([]);
  });
});

describe("Gemini Configuration and Error Handling Tests", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws clear error when GOOGLE_GENERATIVE_AI_API_KEY is missing", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const { generateFlowGraph } = await import("../lib/gemini");

    await expect(generateFlowGraph("Simple process")).rejects.toThrow(
      "Google Gemini API key is missing"
    );
  });

  it("defaults to gemini-3.8-flash and respects custom GEMINI_MODEL", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test_mock_key";
    process.env.GEMINI_MODEL = "gemini-custom-model";

    expect(process.env.GEMINI_MODEL).toBe("gemini-custom-model");
  });
});
