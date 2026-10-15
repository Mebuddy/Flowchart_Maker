import React from "react";
import {
  PlayCircle,
  Square,
  HelpCircle,
  FileInput,
  Layers,
  FileText,
  Database,
  StopCircle,
  Plus,
} from "lucide-react";
import { NodeType } from "@/lib/schema";

interface ToolbarProps {
  onAddNode: (type: NodeType, label: string) => void;
}

const TOOLBAR_ITEMS: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: "start", label: "Start", icon: <PlayCircle className="w-4 h-4" />, color: "text-emerald-400" },
  { type: "process", label: "Process", icon: <Square className="w-4 h-4" />, color: "text-blue-400" },
  { type: "decision", label: "Decision", icon: <HelpCircle className="w-4 h-4" />, color: "text-amber-400" },
  { type: "inputOutput", label: "I/O", icon: <FileInput className="w-4 h-4" />, color: "text-cyan-400" },
  { type: "subprocess", label: "Subprocess", icon: <Layers className="w-4 h-4" />, color: "text-indigo-400" },
  { type: "document", label: "Document", icon: <FileText className="w-4 h-4" />, color: "text-purple-400" },
  { type: "database", label: "Database", icon: <Database className="w-4 h-4" />, color: "text-teal-400" },
  { type: "end", label: "End", icon: <StopCircle className="w-4 h-4" />, color: "text-rose-400" },
];

export const Toolbar: React.FC<ToolbarProps> = ({ onAddNode }) => {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl">
      <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center gap-1">
        <Plus className="w-3.5 h-3.5" />
        Add:
      </span>
      {TOOLBAR_ITEMS.map((item) => (
        <button
          key={item.type}
          onClick={() => onAddNode(item.type, `New ${item.label}`)}
          title={`Add ${item.label} Node`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/50 rounded-lg transition-all active:scale-95 shadow-sm"
        >
          <span className={item.color}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
