import { describe, it, expect } from "vitest";
import { calculateAutoLayout, getNodeDimensions } from "../lib/layout";
import { FlowNode, FlowEdge } from "../lib/schema";

describe("ELK.js Layout Engine Tests", () => {
  it("calculates dimensions for different node types appropriately", () => {
    const decisionDim = getNodeDimensions("decision", "Is Temperature Exceeded?");
    expect(decisionDim.width).toBeGreaterThanOrEqual(190);
    expect(decisionDim.height).toBeGreaterThanOrEqual(90);

    const startDim = getNodeDimensions("start", "Start");
    expect(startDim.width).toBe(160);
    expect(startDim.height).toBe(60);
  });

  it("calculates layout for a simple linear graph", async () => {
    const nodes: FlowNode[] = [
      { id: "start", type: "start", label: "Start" },
      { id: "step1", type: "process", label: "Read Sensor" },
      { id: "end", type: "end", label: "End" },
    ];

    const edges: FlowEdge[] = [
      { id: "e1", source: "start", target: "step1" },
      { id: "e2", source: "step1", target: "end" },
    ];

    const result = await calculateAutoLayout(nodes, edges, "TB");
    expect(result.nodes.length).toBe(3);

    const startNode = result.nodes.find((n) => n.id === "start")!;
    const step1Node = result.nodes.find((n) => n.id === "step1")!;
    const endNode = result.nodes.find((n) => n.id === "end")!;

    // In top-to-bottom, Y positions should increase monotonically
    expect(startNode.position.y).toBeLessThan(step1Node.position.y);
    expect(step1Node.position.y).toBeLessThan(endNode.position.y);
  });

  it("calculates layout for a branching decision graph", async () => {
    const nodes: FlowNode[] = [
      { id: "decide", type: "decision", label: "Is Valid?" },
      { id: "yesBranch", type: "process", label: "Process Valid" },
      { id: "noBranch", type: "process", label: "Handle Error" },
    ];

    const edges: FlowEdge[] = [
      { id: "e1", source: "decide", target: "yesBranch", label: "Yes" },
      { id: "e2", source: "decide", target: "noBranch", label: "No" },
    ];

    const result = await calculateAutoLayout(nodes, edges, "TB");
    expect(result.nodes.length).toBe(3);

    const decide = result.nodes.find((n) => n.id === "decide")!;
    const yesBranch = result.nodes.find((n) => n.id === "yesBranch")!;
    const noBranch = result.nodes.find((n) => n.id === "noBranch")!;

    expect(decide.position.y).toBeLessThan(yesBranch.position.y);
    expect(decide.position.y).toBeLessThan(noBranch.position.y);
    // The branches should have different X positions
    expect(yesBranch.position.x).not.toBe(noBranch.position.x);
  });

  it("successfully resolves positions for cyclic feedback loops", async () => {
    const nodes: FlowNode[] = [
      { id: "sample", type: "inputOutput", label: "Sample Data" },
      { id: "check", type: "decision", label: "Complete?" },
      { id: "adjust", type: "process", label: "Adjust Calibration" },
    ];

    const edges: FlowEdge[] = [
      { id: "e1", source: "sample", target: "check" },
      { id: "e2", source: "check", target: "adjust", label: "No" },
      { id: "e3", source: "adjust", target: "sample", label: "Loop" },
    ];

    const result = await calculateAutoLayout(nodes, edges, "TB");
    expect(result.nodes.length).toBe(3);

    for (const node of result.nodes) {
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
      expect(node.width).toBeGreaterThan(0);
      expect(node.height).toBeGreaterThan(0);
    }
  });

  it("supports Left-to-Right (LR) layout", async () => {
    const nodes: FlowNode[] = [
      { id: "step1", type: "process", label: "First" },
      { id: "step2", type: "process", label: "Second" },
    ];

    const edges: FlowEdge[] = [{ id: "e1", source: "step1", target: "step2" }];

    const result = await calculateAutoLayout(nodes, edges, "LR");
    const step1 = result.nodes.find((n) => n.id === "step1")!;
    const step2 = result.nodes.find((n) => n.id === "step2")!;

    // In LR layout, X coordinate increases
    expect(step1.position.x).toBeLessThan(step2.position.x);
  });
});
