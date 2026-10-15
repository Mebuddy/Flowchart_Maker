import { describe, it, expect } from "vitest";
import { validateGraphSemantics } from "../lib/validation";
import { FlowGraph } from "../lib/schema";

describe("Graph Semantic Validation Tests", () => {
  it("detects duplicate node IDs", () => {
    const graph: FlowGraph = {
      title: "Duplicate Test",
      summary: "Summary",
      assumptions: [],
      nodes: [
        { id: "node1", type: "start", label: "Start" },
        { id: "node1", type: "process", label: "Duplicate Step" },
      ],
      edges: [],
    };

    const res = validateGraphSemantics(graph);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.code === "DUPLICATE_NODE_ID")).toBe(true);
  });

  it("detects missing edge endpoints (dangling source or target)", () => {
    const graph: FlowGraph = {
      title: "Missing Endpoints Test",
      summary: "Summary",
      assumptions: [],
      nodes: [
        { id: "node1", type: "start", label: "Start" },
        { id: "node2", type: "end", label: "End" },
      ],
      edges: [
        { id: "e1", source: "node1", target: "node_nonexistent" },
        { id: "e2", source: "node_ghost", target: "node2" },
      ],
    };

    const res = validateGraphSemantics(graph);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.code === "MISSING_TARGET_NODE")).toBe(true);
    expect(res.errors.some((e) => e.code === "MISSING_SOURCE_NODE")).toBe(true);
  });

  it("detects empty node labels", () => {
    const graph: FlowGraph = {
      title: "Empty Label Test",
      summary: "Summary",
      assumptions: [],
      nodes: [{ id: "node1", type: "process", label: "   " }],
      edges: [],
    };

    const res = validateGraphSemantics(graph);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.code === "EMPTY_NODE_LABEL")).toBe(true);
  });

  it("permits legitimate cycles and loops without failing hard validation", () => {
    const cycleGraph: FlowGraph = {
      title: "Continuous Controller Loop",
      summary: "Reads sensor and loops continuously",
      assumptions: ["Continuous operation without termination"],
      nodes: [
        { id: "start", type: "start", label: "System Start" },
        { id: "read", type: "inputOutput", label: "Read Sensor" },
        { id: "decide", type: "decision", label: "Threshold Exceeded?" },
        { id: "act", type: "process", label: "Activate Cooling" },
      ],
      edges: [
        { id: "e1", source: "start", target: "read" },
        { id: "e2", source: "read", target: "decide" },
        { id: "e3", source: "decide", target: "act", label: "Yes" },
        { id: "e4", source: "decide", target: "read", label: "No" },
        { id: "e5", source: "act", target: "read", label: "Loop" },
      ],
    };

    const res = validateGraphSemantics(cycleGraph);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it("warns about incomplete decision branches", () => {
    const graph: FlowGraph = {
      title: "Incomplete Decision Test",
      summary: "Summary",
      assumptions: [],
      nodes: [
        { id: "start", type: "start", label: "Start" },
        { id: "decide", type: "decision", label: "Is Valid?" },
        { id: "next", type: "process", label: "Proceed" },
      ],
      edges: [
        { id: "e1", source: "start", target: "decide" },
        { id: "e2", source: "decide", target: "next" }, // Only 1 branch & unlabeled
      ],
    };

    const res = validateGraphSemantics(graph);
    expect(res.isValid).toBe(true); // Warnings do not invalidate graph
    expect(res.warnings.some((w) => w.code === "DECISION_SINGLE_BRANCH")).toBe(true);
  });

  it("warns about unreachable nodes", () => {
    const graph: FlowGraph = {
      title: "Unreachable Test",
      summary: "Summary",
      assumptions: [],
      nodes: [
        { id: "start", type: "start", label: "Start" },
        { id: "step1", type: "process", label: "Step 1" },
        { id: "orphan", type: "process", label: "Orphaned Step" },
      ],
      edges: [{ id: "e1", source: "start", target: "step1" }],
    };

    const res = validateGraphSemantics(graph);
    expect(res.isValid).toBe(true);
    expect(res.warnings.some((w) => w.code === "UNREACHABLE_NODE")).toBe(true);
  });
});
