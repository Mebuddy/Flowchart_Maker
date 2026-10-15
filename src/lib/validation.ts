import { FlowGraph, FlowNode, FlowEdge, NodeTypeSchema } from "./schema";

export interface ValidationIssue {
  type: "error" | "warning";
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateGraphSemantics(graph: FlowGraph): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. Check graph limits
  if (graph.nodes.length === 0) {
    errors.push({
      type: "error",
      code: "EMPTY_GRAPH",
      message: "The graph does not contain any nodes.",
    });
    return { isValid: false, errors, warnings };
  }

  if (graph.nodes.length > 80) {
    errors.push({
      type: "error",
      code: "EXCESSIVE_NODES",
      message: `Graph exceeds maximum limit of 80 nodes (received ${graph.nodes.length}).`,
    });
  }

  if (graph.edges.length > 150) {
    errors.push({
      type: "error",
      code: "EXCESSIVE_EDGES",
      message: `Graph exceeds maximum limit of 150 edges (received ${graph.edges.length}).`,
    });
  }

  // 2. Validate nodes
  const nodeMap = new Map<string, FlowNode>();
  const nodeIds = new Set<string>();

  for (const node of graph.nodes) {
    if (!node.id || node.id.trim() === "") {
      errors.push({
        type: "error",
        code: "EMPTY_NODE_ID",
        message: "A node has an empty or missing identifier.",
      });
      continue;
    }

    if (nodeIds.has(node.id)) {
      errors.push({
        type: "error",
        code: "DUPLICATE_NODE_ID",
        message: `Duplicate node ID detected: "${node.id}".`,
        nodeId: node.id,
      });
    } else {
      nodeIds.add(node.id);
      nodeMap.set(node.id, node);
    }

    if (!node.label || node.label.trim() === "") {
      errors.push({
        type: "error",
        code: "EMPTY_NODE_LABEL",
        message: `Node "${node.id}" has an empty label.`,
        nodeId: node.id,
      });
    }

    const typeParse = NodeTypeSchema.safeParse(node.type);
    if (!typeParse.success) {
      errors.push({
        type: "error",
        code: "INVALID_NODE_TYPE",
        message: `Node "${node.id}" has unsupported type: "${node.type}".`,
        nodeId: node.id,
      });
    }
  }

  // 3. Validate edges
  const edgeIds = new Set<string>();
  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();
  const decisionBranches = new Map<string, { label?: string; target: string }[]>();

  for (const node of graph.nodes) {
    incomingCount.set(node.id, 0);
    outgoingCount.set(node.id, 0);
    if (node.type === "decision") {
      decisionBranches.set(node.id, []);
    }
  }

  for (const edge of graph.edges) {
    if (!edge.id || edge.id.trim() === "") {
      errors.push({
        type: "error",
        code: "EMPTY_EDGE_ID",
        message: "An edge has an empty or missing identifier.",
      });
    } else if (edgeIds.has(edge.id)) {
      errors.push({
        type: "error",
        code: "DUPLICATE_EDGE_ID",
        message: `Duplicate edge ID detected: "${edge.id}".`,
        edgeId: edge.id,
      });
    } else {
      edgeIds.add(edge.id);
    }

    // Source node check
    if (!nodeMap.has(edge.source)) {
      errors.push({
        type: "error",
        code: "MISSING_SOURCE_NODE",
        message: `Edge "${edge.id}" references nonexistent source node "${edge.source}".`,
        edgeId: edge.id,
      });
    } else {
      outgoingCount.set(edge.source, (outgoingCount.get(edge.source) || 0) + 1);
    }

    // Target node check
    if (!nodeMap.has(edge.target)) {
      errors.push({
        type: "error",
        code: "MISSING_TARGET_NODE",
        message: `Edge "${edge.id}" references nonexistent target node "${edge.target}".`,
        edgeId: edge.id,
      });
    } else {
      incomingCount.set(edge.target, (incomingCount.get(edge.target) || 0) + 1);
    }

    // Track decision branches
    if (nodeMap.get(edge.source)?.type === "decision") {
      const branches = decisionBranches.get(edge.source) || [];
      branches.push({ label: edge.label, target: edge.target });
      decisionBranches.set(edge.source, branches);
    }
  }

  // 4. Semantic Warnings
  const hasStart = graph.nodes.some((n) => n.type === "start");
  const hasEnd = graph.nodes.some((n) => n.type === "end");

  if (!hasStart && graph.nodes.length > 1) {
    warnings.push({
      type: "warning",
      code: "NO_START_NODE",
      message: "Diagram does not contain an explicit start node.",
    });
  }

  if (!hasEnd && graph.nodes.length > 2) {
    // Only warn if there isn't an obvious continuous cycle
    warnings.push({
      type: "warning",
      code: "NO_END_NODE",
      message: "Diagram has no designated end node (acceptable for infinite loops or continuous controllers).",
    });
  }

  // Check unreachable nodes (nodes with 0 incoming edges that are not 'start' nodes)
  for (const node of graph.nodes) {
    const inCount = incomingCount.get(node.id) || 0;
    if (inCount === 0 && node.type !== "start" && graph.nodes.length > 1) {
      warnings.push({
        type: "warning",
        code: "UNREACHABLE_NODE",
        message: `Node "${node.label}" (${node.id}) has no incoming edges.`,
        nodeId: node.id,
      });
    }
  }

  // Check decision nodes with fewer than 2 branches or unlabeled branches
  for (const [decisionId, branches] of decisionBranches.entries()) {
    const decisionNode = nodeMap.get(decisionId);
    if (!decisionNode) continue;

    if (branches.length === 0) {
      warnings.push({
        type: "warning",
        code: "DECISION_NO_BRANCHES",
        message: `Decision "${decisionNode.label}" (${decisionId}) has no outgoing paths.`,
        nodeId: decisionId,
      });
    } else if (branches.length === 1) {
      warnings.push({
        type: "warning",
        code: "DECISION_SINGLE_BRANCH",
        message: `Decision "${decisionNode.label}" (${decisionId}) only has one outgoing path (${branches[0].label || "unlabeled"}).`,
        nodeId: decisionId,
      });
    } else {
      const unlabelled = branches.filter((b) => !b.label || b.label.trim() === "");
      if (unlabelled.length > 0) {
        warnings.push({
          type: "warning",
          code: "DECISION_UNLABELED_BRANCH",
          message: `Decision "${decisionNode.label}" (${decisionId}) has ${unlabelled.length} unlabeled branch(es). Consider adding Yes/No labels.`,
          nodeId: decisionId,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
