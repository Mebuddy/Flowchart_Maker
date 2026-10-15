import React from "react";
import {
  Copy,
  Trash2,
  Maximize2,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  type: "node" | "edge" | "canvas";
  targetId?: string;
  onClose: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddNode?: (type?: any, label?: string) => void;
  onAutoLayout?: () => void;
  onEditAi?: () => void;
  onClearCanvas?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  type,
  targetId,
  onClose,
  onDuplicate,
  onDelete,
  onAddNode,
  onAutoLayout,
  onEditAi,
  onClearCanvas,
}) => {
  return (
    <div
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
      className="flowcraft-exclude-export fixed z-50 min-w-[160px] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl p-1 text-slate-200 text-xs animate-in fade-in zoom-in-95"
    >
      {type === "node" && (
        <>
          <button
            onClick={() => {
              onDuplicate?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white text-left"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Duplicate Node</span>
          </button>
          <button
            onClick={() => {
              onEditAi?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white text-left"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Edit Subgraph</span>
          </button>
          <div className="h-px bg-slate-800 my-1" />
          <button
            onClick={() => {
              onDelete?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Node</span>
          </button>
        </>
      )}

      {type === "edge" && (
        <>
          <button
            onClick={() => {
              onDelete?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Connection</span>
          </button>
        </>
      )}

      {type === "canvas" && (
        <>
          <button
            onClick={() => {
              onAddNode?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white text-left"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Process Node</span>
          </button>
          <button
            onClick={() => {
              onAutoLayout?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white text-left"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Auto Layout</span>
          </button>
          <div className="h-px bg-slate-800 my-1" />
          <button
            onClick={() => {
              onClearCanvas?.();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Canvas</span>
          </button>
        </>
      )}
    </div>
  );
};
