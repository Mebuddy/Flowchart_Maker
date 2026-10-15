import React, { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { NodeStyle, NodeType } from "@/lib/schema";
import { DIAGRAM_PRESETS } from "@/lib/presets";

export interface CustomNodeData {
  label: string;
  description?: string;
  type: NodeType;
  style?: NodeStyle;
  preset?: string;
  isSearchMatch?: boolean;
  isSearchActive?: boolean;
  onLabelChange?: (newLabel: string) => void;
}

// 4-way connection handles
export const NodeHandles = memo(() => {
  const handleStyle = {
    width: 8,
    height: 8,
    backgroundColor: "#3B82F6",
    border: "2px solid #1E293B",
  };

  return (
    <>
      <Handle type="target" position={Position.Top} id="top-target" style={{ ...handleStyle, top: -4 }} />
      <Handle type="source" position={Position.Top} id="top-source" style={{ ...handleStyle, top: -4, opacity: 0 }} />

      <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, right: -4 }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ ...handleStyle, right: -4, opacity: 0 }} />

      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, bottom: -4 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ ...handleStyle, bottom: -4, opacity: 0 }} />

      <Handle type="target" position={Position.Left} id="left-target" style={{ ...handleStyle, left: -4 }} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ ...handleStyle, left: -4, opacity: 0 }} />
    </>
  );
});
NodeHandles.displayName = "NodeHandles";

// Inline text label editor on double-click
interface InlineLabelEditorProps {
  label: string;
  isEditing: boolean;
  onCommit: (newLabel: string) => void;
  onCancel: () => void;
  style?: NodeStyle;
  className?: string;
}

export const InlineLabelEditor: React.FC<InlineLabelEditorProps> = ({
  label,
  isEditing,
  onCommit,
  onCancel,
  style,
  className = "",
}) => {
  const [val, setVal] = useState(label);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setVal(label);
  }, [label]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  if (!isEditing) {
    return (
      <span
        style={{
          color: style?.textColor,
          fontSize: style?.fontSize ? `${style.fontSize}px` : undefined,
          fontWeight: style?.fontWeight,
          textAlign: style?.textAlign || "center",
        }}
        className={`break-words select-none leading-snug ${className}`}
      >
        {label}
      </span>
    );
  }

  return (
    <textarea
      ref={inputRef}
      value={val}
      rows={Math.max(1, Math.min(4, Math.ceil(val.length / 18)))}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onCommit(val.trim() || label);
        } else if (e.key === "Escape") {
          e.preventDefault();
          setVal(label);
          onCancel();
        }
      }}
      onBlur={() => onCommit(val.trim() || label)}
      className="nodrag text-xs font-medium text-slate-100 bg-slate-950/90 border border-blue-400 rounded px-1.5 py-0.5 outline-none resize-none shadow-lg text-center w-full"
      style={{
        fontSize: style?.fontSize ? `${style.fontSize}px` : "12px",
      }}
    />
  );
};

// Helper to resolve colors from presets and custom style
function getNodeColors(type: NodeType, presetKey?: string, customStyle?: NodeStyle) {
  const preset = DIAGRAM_PRESETS[(presetKey as keyof typeof DIAGRAM_PRESETS) || "default"] || DIAGRAM_PRESETS.default;
  const typeColors = preset.types[type] || preset.defaultNode;

  return {
    bg: customStyle?.fillColor || typeColors.bg,
    border: customStyle?.borderColor || typeColors.border,
    text: customStyle?.textColor || typeColors.text,
    badge: (typeColors as any).badge || typeColors.border,
    borderWidth: customStyle?.borderWidth ?? 1,
    borderRadius: customStyle?.borderRadius,
  };
}

// 1. START NODE (Rounded Pill)
export const StartNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("start", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: `${colors.borderWidth}px`,
        borderRadius: colors.borderRadius !== undefined ? `${colors.borderRadius}px` : "9999px",
      }}
      className={`relative px-6 py-3 flex items-center justify-center text-center shadow-lg transition-all min-w-[140px] max-w-[260px] ${
        selected ? "ring-2 ring-emerald-400 shadow-emerald-500/30" : ""
      } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400/80" : ""}`}
    >
      <NodeHandles />
      <div className="flex flex-col items-center max-w-[200px]">
        <span
          style={{ color: colors.badge }}
          className="text-[10px] font-bold tracking-wider uppercase mb-0.5 pointer-events-none"
        >
          Start
        </span>
        <InlineLabelEditor
          label={nodeData.label}
          isEditing={isEditing}
          onCommit={(newLabel) => {
            setIsEditing(false);
            nodeData.onLabelChange?.(newLabel);
          }}
          onCancel={() => setIsEditing(false)}
          style={nodeData.style}
          className="text-xs font-semibold"
        />
      </div>
    </div>
  );
});
StartNode.displayName = "StartNode";

// 2. END NODE (Rounded Pill)
export const EndNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("end", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: `${colors.borderWidth}px`,
        borderRadius: colors.borderRadius !== undefined ? `${colors.borderRadius}px` : "9999px",
      }}
      className={`relative px-6 py-3 flex items-center justify-center text-center shadow-lg transition-all min-w-[140px] max-w-[260px] ${
        selected ? "ring-2 ring-rose-400 shadow-rose-500/30" : ""
      } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400/80" : ""}`}
    >
      <NodeHandles />
      <div className="flex flex-col items-center max-w-[200px]">
        <span
          style={{ color: colors.badge }}
          className="text-[10px] font-bold tracking-wider uppercase mb-0.5 pointer-events-none"
        >
          End
        </span>
        <InlineLabelEditor
          label={nodeData.label}
          isEditing={isEditing}
          onCommit={(newLabel) => {
            setIsEditing(false);
            nodeData.onLabelChange?.(newLabel);
          }}
          onCancel={() => setIsEditing(false)}
          style={nodeData.style}
          className="text-xs font-semibold"
        />
      </div>
    </div>
  );
});
EndNode.displayName = "EndNode";

// 3. PROCESS NODE (Rectangle)
export const ProcessNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("process", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderWidth: `${colors.borderWidth}px`,
        borderRadius: colors.borderRadius !== undefined ? `${colors.borderRadius}px` : "8px",
      }}
      className={`relative px-5 py-3.5 flex flex-col justify-center text-center shadow-md transition-all min-w-[160px] max-w-[280px] ${
        selected ? "ring-2 ring-blue-400 shadow-blue-500/30" : ""
      } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400/80" : ""}`}
    >
      <NodeHandles />
      <InlineLabelEditor
        label={nodeData.label}
        isEditing={isEditing}
        onCommit={(newLabel) => {
          setIsEditing(false);
          nodeData.onLabelChange?.(newLabel);
        }}
        onCancel={() => setIsEditing(false)}
        style={nodeData.style}
        className="text-xs font-medium"
      />
      {nodeData.description && !isEditing && (
        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
          {nodeData.description}
        </div>
      )}
    </div>
  );
});
ProcessNode.displayName = "ProcessNode";

// 4. DECISION NODE (Diamond Shape)
export const DecisionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("decision", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className="relative flex items-center justify-center min-w-[190px] max-w-[260px] h-[105px]"
    >
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-amber-400 stroke-2" : ""
        } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400" : ""}`}
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="100,2 198,50 100,98 2,50"
          style={{
            fill: colors.bg,
            stroke: colors.border,
            strokeWidth: colors.borderWidth,
          }}
        />
      </svg>
      <div className="relative z-10 px-6 py-2 text-center flex flex-col items-center justify-center max-w-[140px]">
        <span
          style={{ color: colors.badge }}
          className="text-[9px] uppercase font-bold tracking-wider mb-0.5 pointer-events-none"
        >
          Decision
        </span>
        <InlineLabelEditor
          label={nodeData.label}
          isEditing={isEditing}
          onCommit={(newLabel) => {
            setIsEditing(false);
            nodeData.onLabelChange?.(newLabel);
          }}
          onCancel={() => setIsEditing(false)}
          style={nodeData.style}
          className="text-xs font-semibold leading-tight"
        />
      </div>
    </div>
  );
});
DecisionNode.displayName = "DecisionNode";

// 5. INPUT/OUTPUT NODE (Parallelogram)
export const InputOutputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("inputOutput", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className="relative flex items-center justify-center min-w-[180px] max-w-[260px] h-[80px]"
    >
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-cyan-400 stroke-2" : ""
        } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400" : ""}`}
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
      >
        <polygon
          points="30,2 198,2 170,78 2,78"
          style={{
            fill: colors.bg,
            stroke: colors.border,
            strokeWidth: colors.borderWidth,
          }}
        />
      </svg>
      <div className="relative z-10 px-8 py-2 text-center flex flex-col items-center justify-center max-w-[160px]">
        <span
          style={{ color: colors.badge }}
          className="text-[9px] uppercase font-bold tracking-wider mb-0.5 pointer-events-none"
        >
          Input / Output
        </span>
        <InlineLabelEditor
          label={nodeData.label}
          isEditing={isEditing}
          onCommit={(newLabel) => {
            setIsEditing(false);
            nodeData.onLabelChange?.(newLabel);
          }}
          onCancel={() => setIsEditing(false)}
          style={nodeData.style}
          className="text-xs font-medium leading-tight"
        />
      </div>
    </div>
  );
});
InputOutputNode.displayName = "InputOutputNode";

// 6. SUBPROCESS NODE (Double vertical borders)
export const SubprocessNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("subprocess", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        borderLeftWidth: "4px",
        borderRightWidth: "4px",
        borderTopWidth: `${colors.borderWidth}px`,
        borderBottomWidth: `${colors.borderWidth}px`,
        borderRadius: colors.borderRadius !== undefined ? `${colors.borderRadius}px` : "8px",
      }}
      className={`relative px-6 py-3.5 flex flex-col justify-center text-center shadow-md transition-all min-w-[180px] max-w-[280px] ${
        selected ? "ring-2 ring-indigo-400 shadow-indigo-500/30" : ""
      } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400/80" : ""}`}
    >
      <NodeHandles />
      <span
        style={{ color: colors.badge }}
        className="text-[9px] uppercase font-bold tracking-wider mb-0.5 pointer-events-none"
      >
        Subprocess
      </span>
      <InlineLabelEditor
        label={nodeData.label}
        isEditing={isEditing}
        onCommit={(newLabel) => {
          setIsEditing(false);
          nodeData.onLabelChange?.(newLabel);
        }}
        onCancel={() => setIsEditing(false)}
        style={nodeData.style}
        className="text-xs font-medium"
      />
    </div>
  );
});
SubprocessNode.displayName = "SubprocessNode";

// 7. DOCUMENT NODE (Curved wavy bottom)
export const DocumentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("document", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className="relative flex items-center justify-center min-w-[170px] max-w-[250px] h-[85px]"
    >
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-purple-400 stroke-2" : ""
        } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400" : ""}`}
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
      >
        <path
          d="M 2 2 L 198 2 L 198 75 C 150 65, 120 88, 70 78 C 30 70, 15 80, 2 85 Z"
          style={{
            fill: colors.bg,
            stroke: colors.border,
            strokeWidth: colors.borderWidth,
          }}
        />
      </svg>
      <div className="relative z-10 px-5 pt-2 pb-4 text-center flex flex-col items-center justify-center max-w-[160px]">
        <span
          style={{ color: colors.badge }}
          className="text-[9px] uppercase font-bold tracking-wider mb-0.5 pointer-events-none"
        >
          Document
        </span>
        <InlineLabelEditor
          label={nodeData.label}
          isEditing={isEditing}
          onCommit={(newLabel) => {
            setIsEditing(false);
            nodeData.onLabelChange?.(newLabel);
          }}
          onCancel={() => setIsEditing(false)}
          style={nodeData.style}
          className="text-xs font-medium leading-tight"
        />
      </div>
    </div>
  );
});
DocumentNode.displayName = "DocumentNode";

// 8. DATABASE NODE (Cylinder)
export const DatabaseNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const colors = getNodeColors("database", nodeData.preset, nodeData.style);

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className="relative flex items-center justify-center min-w-[160px] max-w-[240px] h-[90px]"
    >
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-teal-400 stroke-2" : ""
        } ${nodeData.isSearchActive ? "ring-4 ring-yellow-400 animate-pulse" : nodeData.isSearchMatch ? "ring-2 ring-yellow-400" : ""}`}
        viewBox="0 0 180 90"
        preserveAspectRatio="none"
      >
        <path
          d="M 2 20 C 2 8, 178 8, 178 20 L 178 70 C 178 82, 2 82, 2 70 Z"
          style={{
            fill: colors.bg,
            stroke: colors.border,
            strokeWidth: colors.borderWidth,
          }}
        />
        <path
          d="M 2 20 C 2 32, 178 32, 178 20"
          style={{
            fill: "none",
            stroke: colors.border,
            strokeWidth: colors.borderWidth,
          }}
        />
      </svg>
      <div className="relative z-10 px-5 pt-3 pb-2 text-center flex flex-col items-center justify-center max-w-[150px]">
        <span
          style={{ color: colors.badge }}
          className="text-[9px] uppercase font-bold tracking-wider mb-0.5 pointer-events-none"
        >
          Database
        </span>
        <InlineLabelEditor
          label={nodeData.label}
          isEditing={isEditing}
          onCommit={(newLabel) => {
            setIsEditing(false);
            nodeData.onLabelChange?.(newLabel);
          }}
          onCancel={() => setIsEditing(false)}
          style={nodeData.style}
          className="text-xs font-medium leading-tight"
        />
      </div>
    </div>
  );
});
DatabaseNode.displayName = "DatabaseNode";

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
  inputOutput: InputOutputNode,
  subprocess: SubprocessNode,
  document: DocumentNode,
  database: DatabaseNode,
};
