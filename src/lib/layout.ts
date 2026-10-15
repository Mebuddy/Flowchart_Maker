import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import { FlowNode, FlowEdge, LayoutDirection, NodeType } from "./schema";

const elk = new ELK();

export interface NodeLayoutDimensions {
  width: number;
  height: number;
}

export function getNodeDimensions(type: NodeType, label: string): NodeLayoutDimensions {
  const labelLength = label.length;

  switch (type) {
    case "start":
    case "end":
      return {
        width: Math.max(160, Math.min(240, 100 + labelLength * 6)),
        height: 60,
      };
    case "decision":
      return {
        width: Math.max(190, Math.min(260, 120 + labelLength * 6)),
        height: Math.max(90, Math.min(130, 70 + Math.ceil(labelLength / 18) * 16)),
      };
    case "inputOutput":
      return {
        width: Math.max(180, Math.min(260, 110 + labelLength * 6)),
        height: 70,
      };
    case "subprocess":
      return {
        width: Math.max(190, Math.min(260, 120 + labelLength * 6)),
        height: 75,
      };
    case "document":
      return {
        width: Math.max(180, Math.min(250, 110 + labelLength * 6)),
        height: 80,
      };
    case "database":
      return {
        width: Math.max(160, Math.min(240, 100 + labelLength * 6)),
        height: 85,
      };
    case "process":
    default:
      return {
        width: Math.max(180, Math.min(260, 110 + labelLength * 6)),
        height: Math.max(70, Math.min(120, 50 + Math.ceil(labelLength / 22) * 16)),
      };
  }
}

export interface PositionedNode extends FlowNode {
  position: { x: number; y: number };
  width: number;
  height: number;
}

export async function calculateAutoLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: LayoutDirection = "TB"
): Promise<{ nodes: PositionedNode[]; edges: FlowEdge[] }> {
  if (nodes.length === 0) {
    return { nodes: [], edges };
  }

  const elkDirection = direction === "TB" ? "DOWN" : "RIGHT";

  const elkNodes: ElkNode[] = nodes.map((node) => {
    const dim = getNodeDimensions(node.type, node.label);
    return {
      id: node.id,
      width: dim.width,
      height: dim.height,
    };
  });

  const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const rootGraph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": elkDirection,
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "70",
      "elk.layered.spacing.edgeNodeBetweenLayers": "35",
      "elk.spacing.edgeEdge": "25",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.cycleBreaking.strategy": "GREEDY",
      "elk.edgeRouting": "ORTHOGONAL",
    },
    children: elkNodes,
    edges: elkEdges,
  };

  const layoutedGraph = await elk.layout(rootGraph);

  const positionedNodes: PositionedNode[] = nodes.map((node) => {
    const elkChild = layoutedGraph.children?.find((c) => c.id === node.id);
    const dim = getNodeDimensions(node.type, node.label);
    return {
      ...node,
      width: elkChild?.width ?? dim.width,
      height: elkChild?.height ?? dim.height,
      position: {
        x: elkChild?.x ?? 0,
        y: elkChild?.y ?? 0,
      },
    };
  });

  return {
    nodes: positionedNodes,
    edges,
  };
}
