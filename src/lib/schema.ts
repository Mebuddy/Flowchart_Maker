import { z } from "zod";

export const NodeTypes = [
  "start",
  "end",
  "process",
  "decision",
  "inputOutput",
  "subprocess",
  "document",
  "database",
] as const;

export type NodeType = (typeof NodeTypes)[number];

export const NodeTypeSchema = z.enum(NodeTypes);

export const FlowNodeSchema = z.object({
  id: z.string().min(1, "Node ID cannot be empty"),
  type: NodeTypeSchema,
  label: z.string().min(1, "Node label cannot be empty"),
  description: z.string().optional(),
});

export type FlowNode = z.infer<typeof FlowNodeSchema>;

export const FlowEdgeSchema = z.object({
  id: z.string().min(1, "Edge ID cannot be empty"),
  source: z.string().min(1, "Source node ID cannot be empty"),
  target: z.string().min(1, "Target node ID cannot be empty"),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});

export type FlowEdge = z.infer<typeof FlowEdgeSchema>;

export const FlowGraphSchema = z.object({
  title: z.string().min(1, "Diagram title is required"),
  summary: z.string().min(1, "Summary is required"),
  assumptions: z.array(z.string()).default([]),
  nodes: z.array(FlowNodeSchema).max(80, "Diagram exceeds maximum allowed nodes (80)"),
  edges: z.array(FlowEdgeSchema).max(150, "Diagram exceeds maximum allowed edges (150)"),
});

export type FlowGraph = z.infer<typeof FlowGraphSchema>;

export const LayoutDirectionSchema = z.enum(["TB", "LR"]);
export type LayoutDirection = z.infer<typeof LayoutDirectionSchema>;

// Persistent project schema for localStorage and JSON import/export
export const FlowProjectNodeSchema = FlowNodeSchema.extend({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

export type FlowProjectNode = z.infer<typeof FlowProjectNodeSchema>;

export const FlowProjectSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().default(""),
  assumptions: z.array(z.string()).default([]),
  originalPrompt: z.string().default(""),
  layoutDirection: LayoutDirectionSchema.default("TB"),
  nodes: z.array(FlowProjectNodeSchema).max(120),
  edges: z.array(FlowEdgeSchema).max(200),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FlowProject = z.infer<typeof FlowProjectSchema>;
