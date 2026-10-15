import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export interface CustomNodeData {
  label: string;
  description?: string;
  type: string;
}

// Common Handle Set for 4-way connections
const NodeHandles = memo(({ isHovered }: { isHovered?: boolean }) => {
  const handleStyle = {
    width: 8,
    height: 8,
    backgroundColor: "#3B82F6",
    border: "2px solid #1E293B",
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        style={{ ...handleStyle, top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        style={{ ...handleStyle, top: -4, opacity: 0 }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ ...handleStyle, right: -4 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        style={{ ...handleStyle, right: -4, opacity: 0 }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ ...handleStyle, bottom: -4 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        style={{ ...handleStyle, bottom: -4, opacity: 0 }}
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        style={{ ...handleStyle, left: -4 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        style={{ ...handleStyle, left: -4, opacity: 0 }}
      />
    </>
  );
});
NodeHandles.displayName = "NodeHandles";

// 1. START NODE
export const StartNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`relative px-6 py-3 rounded-full flex items-center justify-center text-center shadow-lg transition-all min-w-[140px] max-w-[260px] ${
        selected ? "ring-2 ring-emerald-400 shadow-emerald-500/20" : "border border-emerald-500/40"
      } bg-gradient-to-r from-emerald-950/80 to-slate-900 text-emerald-100 backdrop-blur-sm`}
    >
      <NodeHandles />
      <div className="flex flex-col items-center">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400/90 mb-0.5">
          Start
        </span>
        <span className="text-sm font-medium leading-snug break-words">{nodeData.label}</span>
      </div>
    </div>
  );
});
StartNode.displayName = "StartNode";

// 2. END NODE
export const EndNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`relative px-6 py-3 rounded-full flex items-center justify-center text-center shadow-lg transition-all min-w-[140px] max-w-[260px] ${
        selected ? "ring-2 ring-rose-400 shadow-rose-500/20" : "border border-rose-500/40"
      } bg-gradient-to-r from-rose-950/80 to-slate-900 text-rose-100 backdrop-blur-sm`}
    >
      <NodeHandles />
      <div className="flex flex-col items-center">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-rose-400/90 mb-0.5">
          End
        </span>
        <span className="text-sm font-medium leading-snug break-words">{nodeData.label}</span>
      </div>
    </div>
  );
});
EndNode.displayName = "EndNode";

// 3. PROCESS NODE (Rectangle)
export const ProcessNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`relative px-5 py-3.5 rounded-lg flex flex-col justify-center text-center shadow-md transition-all min-w-[160px] max-w-[280px] ${
        selected ? "ring-2 ring-blue-400 border-blue-500/60 shadow-blue-500/20" : "border border-slate-700/80 hover:border-slate-600"
      } bg-slate-900/90 text-slate-100 backdrop-blur-sm`}
    >
      <NodeHandles />
      <div className="text-sm font-medium leading-snug break-words">{nodeData.label}</div>
      {nodeData.description && (
        <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{nodeData.description}</div>
      )}
    </div>
  );
});
ProcessNode.displayName = "ProcessNode";

// 4. DECISION NODE (Diamond Shape)
export const DecisionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div className="relative flex items-center justify-center min-w-[180px] max-w-[240px] h-[100px]">
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-amber-400 stroke-2" : "stroke-amber-500/60 stroke-1"
        }`}
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="100,2 198,50 100,98 2,50"
          className="fill-slate-900/95"
        />
      </svg>
      <div className="relative z-10 px-6 py-2 text-center flex flex-col items-center justify-center max-w-[140px]">
        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-0.5">
          Decision
        </span>
        <span className="text-xs font-semibold leading-tight text-amber-100 break-words line-clamp-3">
          {nodeData.label}
        </span>
      </div>
    </div>
  );
});
DecisionNode.displayName = "DecisionNode";

// 5. INPUT/OUTPUT NODE (Parallelogram)
export const InputOutputNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div className="relative flex items-center justify-center min-w-[170px] max-w-[260px] h-[75px]">
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-cyan-400 stroke-2" : "stroke-cyan-500/50 stroke-1"
        }`}
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
      >
        <polygon
          points="30,2 198,2 170,78 2,78"
          className="fill-slate-900/95"
        />
      </svg>
      <div className="relative z-10 px-8 py-2 text-center flex flex-col items-center justify-center max-w-[160px]">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-cyan-400 mb-0.5">
          Input / Output
        </span>
        <span className="text-xs font-medium leading-tight text-cyan-50 break-words line-clamp-2">
          {nodeData.label}
        </span>
      </div>
    </div>
  );
});
InputOutputNode.displayName = "InputOutputNode";

// 6. SUBPROCESS NODE (Double vertical borders)
export const SubprocessNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`relative px-6 py-3.5 rounded-lg flex flex-col justify-center text-center shadow-md transition-all min-w-[180px] max-w-[280px] border-l-4 border-r-4 ${
        selected ? "ring-2 ring-indigo-400 border-indigo-400 shadow-indigo-500/20" : "border-indigo-500/80"
      } bg-slate-900/95 text-indigo-100 border-t border-b border-t-slate-700 border-b-slate-700`}
    >
      <NodeHandles />
      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 mb-0.5">
        Subprocess
      </span>
      <div className="text-sm font-medium leading-snug break-words">{nodeData.label}</div>
    </div>
  );
});
SubprocessNode.displayName = "SubprocessNode";

// 7. DOCUMENT NODE (Curved wavy bottom)
export const DocumentNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div className="relative flex items-center justify-center min-w-[170px] max-w-[250px] h-[80px]">
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-purple-400 stroke-2" : "stroke-purple-500/50 stroke-1"
        }`}
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
      >
        <path
          d="M 2 2 L 198 2 L 198 75 C 150 65, 120 88, 70 78 C 30 70, 15 80, 2 85 Z"
          className="fill-slate-900/95"
        />
      </svg>
      <div className="relative z-10 px-5 pt-2 pb-4 text-center flex flex-col items-center justify-center max-w-[160px]">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-purple-400 mb-0.5">
          Document
        </span>
        <span className="text-xs font-medium leading-tight text-purple-50 break-words line-clamp-2">
          {nodeData.label}
        </span>
      </div>
    </div>
  );
});
DocumentNode.displayName = "DocumentNode";

// 8. DATABASE NODE (Cylinder)
export const DatabaseNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div className="relative flex items-center justify-center min-w-[160px] max-w-[240px] h-[85px]">
      <NodeHandles />
      <svg
        className={`absolute inset-0 w-full h-full filter drop-shadow-md transition-all ${
          selected ? "stroke-teal-400 stroke-2" : "stroke-teal-500/50 stroke-1"
        }`}
        viewBox="0 0 180 90"
        preserveAspectRatio="none"
      >
        <path
          d="M 2 20 C 2 8, 178 8, 178 20 L 178 70 C 178 82, 2 82, 2 70 Z"
          className="fill-slate-900/95"
        />
        <path
          d="M 2 20 C 2 32, 178 32, 178 20"
          className="fill-none"
        />
      </svg>
      <div className="relative z-10 px-5 pt-3 pb-2 text-center flex flex-col items-center justify-center max-w-[150px]">
        <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-400 mb-0.5">
          Database
        </span>
        <span className="text-xs font-medium leading-tight text-teal-50 break-words line-clamp-2">
          {nodeData.label}
        </span>
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
