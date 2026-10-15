import React, { useState } from "react";
import {
  Sliders,
  Info,
  Trash2,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  X,
  FileQuestion,
} from "lucide-react";
import { NodeType, NodeTypes } from "@/lib/schema";
import { ValidationIssue } from "@/lib/validation";

interface RightSidebarProps {
  selectedNode: {
    id: string;
    type: NodeType;
    label: string;
    description?: string;
  } | null;
  selectedEdge: {
    id: string;
    source: string;
    target: string;
    label?: string;
  } | null;
  onUpdateNode: (id: string, updates: { label?: string; type?: NodeType; description?: string }) => void;
  onDeleteNode: (id: string) => void;
  onUpdateEdge: (id: string, updates: { label?: string }) => void;
  onDeleteEdge: (id: string) => void;
  diagramSummary: string;
  diagramAssumptions: string[];
  validationWarnings: ValidationIssue[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
  diagramSummary,
  diagramAssumptions,
  validationWarnings,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<"inspector" | "analysis">("inspector");

  if (!isOpen) {
    return (
      <div className="relative z-20">
        <button
          onClick={onToggleOpen}
          title="Open Inspector Panel"
          className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg shadow-xl hover:bg-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 md:w-88 h-[calc(100vh-3.5rem)] bg-slate-950/95 border-l border-slate-800 flex flex-col z-20 shrink-0 select-none backdrop-blur-md">
      {/* Header Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("inspector")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "inspector"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inspector</span>
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "analysis"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Analysis</span>
            {validationWarnings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        <button
          onClick={onToggleOpen}
          title="Collapse Panel"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {activeTab === "inspector" && (
          <div>
            {selectedNode ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Node Properties
                  </span>
                  <button
                    onClick={() => onDeleteNode(selectedNode.id)}
                    className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* Node ID */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Identifier
                  </label>
                  <div className="text-xs font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-800 truncate">
                    {selectedNode.id}
                  </div>
                </div>

                {/* Node Label */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Node Type */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Shape / Type
                  </label>
                  <select
                    value={selectedNode.type}
                    onChange={(e) => onUpdateNode(selectedNode.id, { type: e.target.value as NodeType })}
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  >
                    {NodeTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Description / Metadata
                  </label>
                  <textarea
                    value={selectedNode.description || ""}
                    onChange={(e) => onUpdateNode(selectedNode.id, { description: e.target.value })}
                    rows={3}
                    placeholder="Optional technical notes, sensor specs, etc."
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg p-2.5 outline-none focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
            ) : selectedEdge ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Connection Properties
                  </span>
                  <button
                    onClick={() => onDeleteEdge(selectedEdge.id)}
                    className="flex items-center gap-1 text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                {/* From -> To */}
                <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 font-mono text-[11px]">Source: </span>
                    <span className="text-slate-200 font-medium">{selectedEdge.source}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-mono text-[11px]">Target: </span>
                    <span className="text-slate-200 font-medium">{selectedEdge.target}</span>
                  </div>
                </div>

                {/* Branch Label */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Branch Condition Label
                  </label>
                  <input
                    type="text"
                    value={selectedEdge.label || ""}
                    onChange={(e) => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
                    placeholder="e.g. Yes, No, True, False, Error..."
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />

                  {/* Quick label tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {["Yes", "No", "True", "False", "Success", "Failure", "Retry"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onUpdateEdge(selectedEdge.id, { label: tag })}
                        className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 px-4 space-y-2 text-slate-500">
                <FileQuestion className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-400">No element selected</p>
                <p className="text-[11px] leading-relaxed">
                  Click on any node or connection on the canvas to inspect and edit its properties.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-5 animate-in fade-in text-xs">
            {/* Summary */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Diagram Summary
              </span>
              <p className="text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 leading-relaxed">
                {diagramSummary || "No summary provided."}
              </p>
            </div>

            {/* Assumptions */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>Model Assumptions ({diagramAssumptions.length})</span>
              </span>
              {diagramAssumptions.length === 0 ? (
                <div className="text-slate-500 italic p-2 text-[11px]">
                  No explicit assumptions recorded.
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {diagramAssumptions.map((assump, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-200/90 text-[11px] leading-relaxed"
                    >
                      {assump}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Validation Warnings */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Semantic Checks ({validationWarnings.length})</span>
              </span>
              {validationWarnings.length === 0 ? (
                <div className="text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-[11px]">
                  Graph structure is fully valid with no warnings.
                </div>
              ) : (
                <ul className="space-y-2">
                  {validationWarnings.map((warn, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-relaxed"
                    >
                      <span className="font-semibold block font-mono text-[10px] text-amber-400">
                        {warn.code}
                      </span>
                      {warn.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
