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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Grid,
  Magnet,
  Palette,
  Search,
  Sparkles,
  Lock,
  Unlock,
} from "lucide-react";
import { NodeType, DiagramPreset } from "@/lib/schema";
import { DIAGRAM_PRESETS } from "@/lib/presets";

interface ToolbarProps {
  onAddNode: (type: NodeType, label: string) => void;
  selectedNodesCount: number;
  onAlign: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom" | "distributeHoriz" | "distributeVert") => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: () => void;
  isLocked: boolean;
  onToggleLock: () => void;
  currentPreset: DiagramPreset;
  onSelectPreset: (preset: DiagramPreset) => void;
  onOpenSearch: () => void;
}

const TOOLBAR_ITEMS: { type: NodeType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: "start", label: "Start", icon: <PlayCircle className="w-3.5 h-3.5" />, color: "text-emerald-400" },
  { type: "process", label: "Process", icon: <Square className="w-3.5 h-3.5" />, color: "text-blue-400" },
  { type: "decision", label: "Decision", icon: <HelpCircle className="w-3.5 h-3.5" />, color: "text-amber-400" },
  { type: "inputOutput", label: "I/O", icon: <FileInput className="w-3.5 h-3.5" />, color: "text-cyan-400" },
  { type: "subprocess", label: "Subproc", icon: <Layers className="w-3.5 h-3.5" />, color: "text-indigo-400" },
  { type: "document", label: "Doc", icon: <FileText className="w-3.5 h-3.5" />, color: "text-purple-400" },
  { type: "database", label: "DB", icon: <Database className="w-3.5 h-3.5" />, color: "text-teal-400" },
  { type: "end", label: "End", icon: <StopCircle className="w-3.5 h-3.5" />, color: "text-rose-400" },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddNode,
  selectedNodesCount,
  onAlign,
  snapToGrid,
  onToggleSnapToGrid,
  isLocked,
  onToggleLock,
  currentPreset,
  onSelectPreset,
  onOpenSearch,
}) => {
  return (
    <div className="flowcraft-exclude-export absolute top-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl max-w-[95vw]">
      {/* Add Node Group */}
      <div className="flex items-center gap-1 pr-1 border-r border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 flex items-center gap-0.5">
          <Plus className="w-3 h-3 text-blue-400" />
          Add:
        </span>
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.type}
            onClick={() => onAddNode(item.type, `New ${item.label}`)}
            title={`Add ${item.label} Node`}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 rounded-md transition-all active:scale-95 shadow-sm"
          >
            <span className={item.color}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Alignment Actions (Visible when 2+ nodes selected) */}
      {selectedNodesCount >= 2 && (
        <div className="flex items-center gap-1 px-1 border-r border-slate-800 animate-in fade-in">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-1">
            Align ({selectedNodesCount}):
          </span>
          <button
            onClick={() => onAlign("left")}
            title="Align Left"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign("center")}
            title="Align Horizontal Center"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign("right")}
            title="Align Right"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign("top")}
            title="Align Top"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
          >
            <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign("middle")}
            title="Align Vertical Middle"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
          >
            <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlign("bottom")}
            title="Align Bottom"
            className="p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
          >
            <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Preset Theme Selector */}
      <div className="flex items-center gap-1 px-1 border-r border-slate-800">
        <Palette className="w-3.5 h-3.5 text-indigo-400 ml-1" />
        <select
          value={currentPreset}
          onChange={(e) => onSelectPreset(e.target.value as DiagramPreset)}
          title="Select visual palette preset"
          className="text-[11px] font-semibold text-slate-200 bg-slate-800 border border-slate-700/80 rounded px-2 py-1 outline-none hover:border-indigo-500 cursor-pointer"
        >
          {Object.entries(DIAGRAM_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Snap to Grid & Canvas Lock */}
      <div className="flex items-center gap-1 pl-1">
        <button
          onClick={onToggleSnapToGrid}
          title={snapToGrid ? "Snap to grid active (click to disable)" : "Enable snap to grid (20px)"}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md border transition-all ${
            snapToGrid
              ? "bg-blue-600/30 text-blue-300 border-blue-500/50"
              : "bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200"
          }`}
        >
          <Magnet className="w-3 h-3" />
          <span>Snap</span>
        </button>

        <button
          onClick={onToggleLock}
          title={isLocked ? "Canvas locked (click to unlock)" : "Lock canvas interactions"}
          className={`p-1.5 text-[11px] rounded-md border transition-all ${
            isLocked
              ? "bg-amber-600/30 text-amber-300 border-amber-500/50"
              : "bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-slate-200"
          }`}
        >
          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>

        <button
          onClick={onOpenSearch}
          title="Search nodes (Ctrl+F)"
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 border border-slate-700/60 rounded-md hover:bg-slate-700 transition-all"
        >
          <Search className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
