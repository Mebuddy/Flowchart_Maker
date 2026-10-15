import React, { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
  X,
  Layers,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { NodeType, NodeTypes } from "@/lib/schema";
import { DIAGRAM_PRESETS } from "@/lib/presets";
import { ValidationIssue } from "@/lib/validation";

interface RightSidebarProps {
  selectedNode: {
    id: string;
    type: NodeType;
    label: string;
    description?: string;
    style?: {
      fillColor?: string;
      borderColor?: string;
      borderWidth?: number;
      borderRadius?: number;
      textColor?: string;
      fontSize?: number;
      fontWeight?: string;
      textAlign?: "left" | "center" | "right";
    };
  } | null;
  selectedEdge: {
    id: string;
    source: string;
    target: string;
    label?: string;
    routing?: "smoothstep" | "step" | "straight" | "bezier";
  } | null;
  selectedNodesCount: number;
  onUpdateNode: (
    id: string,
    updates: {
      label?: string;
      type?: NodeType;
      description?: string;
      style?: any;
    }
  ) => void;
  onDeleteNode: (id: string) => void;
  onUpdateEdge: (
    id: string,
    updates: { label?: string; routing?: "smoothstep" | "step" | "straight" | "bezier" }
  ) => void;
  onDeleteEdge: (id: string) => void;
  onAiModify: (instruction: string, onlySelected: boolean) => Promise<void>;
  isAiModifying: boolean;
  diagramSummary: string;
  diagramAssumptions: string[];
  validationWarnings: ValidationIssue[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

const COLOR_SWATCHES = [
  "#0F172A",
  "#1E293B",
  "#064E3B",
  "#881337",
  "#1E1B4B",
  "#083344",
  "#3B0764",
  "#134E4A",
  "#334155",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  selectedNode,
  selectedEdge,
  selectedNodesCount,
  onUpdateNode,
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
  onAiModify,
  isAiModifying,
  diagramSummary,
  diagramAssumptions,
  validationWarnings,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<"style" | "aimod" | "analysis">("style");
  const [aiInstruction, setAiInstruction] = useState("");
  const [onlySelectedScope, setOnlySelectedScope] = useState(false);

  if (!isOpen) {
    return (
      <div className="relative z-20">
        <button
          onClick={onToggleOpen}
          title="Open Inspector Panel"
          className="absolute top-4 right-4 p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg shadow-xl hover:bg-slate-800 transition-colors"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInstruction.trim() || isAiModifying) return;
    await onAiModify(aiInstruction.trim(), onlySelectedScope && selectedNodesCount > 0);
    setAiInstruction("");
  };

  return (
    <aside className="w-80 md:w-88 h-[calc(100vh-3.5rem)] bg-slate-950/95 border-l border-slate-800 flex flex-col z-20 shrink-0 select-none backdrop-blur-md">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("style")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "style" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Style & Data
          </button>
          <button
            onClick={() => setActiveTab("aimod")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
              activeTab === "aimod" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-300" />
            <span>AI Edit</span>
          </button>
          <button
            onClick={() => setActiveTab("analysis")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
              activeTab === "analysis" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Analysis</span>
            {validationWarnings.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>
        </div>

        <button
          onClick={onToggleOpen}
          title="Collapse Panel"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* TAB 1: STYLE & DATA */}
        {activeTab === "style" && (
          <div>
            {selectedNode ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Node Styling & Properties
                  </span>
                  <button
                    onClick={() => onDeleteNode(selectedNode.id)}
                    className="text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
                  >
                    Delete Node
                  </button>
                </div>

                {/* Node Label */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Label (or double click node)
                  </label>
                  <input
                    type="text"
                    value={selectedNode.label}
                    onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Node Shape / Type */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Semantic Shape
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

                {/* Fill Color */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                    Custom Fill Color
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          onUpdateNode(selectedNode.id, {
                            style: { ...selectedNode.style, fillColor: color },
                          })
                        }
                        style={{ backgroundColor: color }}
                        className={`w-5 h-5 rounded border border-slate-700/80 transition-transform active:scale-90 ${
                          selectedNode.style?.fillColor === color ? "ring-2 ring-white scale-110" : ""
                        }`}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Hex e.g. #0F172A"
                    value={selectedNode.style?.fillColor || ""}
                    onChange={(e) =>
                      onUpdateNode(selectedNode.id, {
                        style: { ...selectedNode.style, fillColor: e.target.value },
                      })
                    }
                    className="w-full text-xs font-mono text-slate-300 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 outline-none"
                  />
                </div>

                {/* Border Color & Width */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Border Color
                    </label>
                    <input
                      type="text"
                      placeholder="#3B82F6"
                      value={selectedNode.style?.borderColor || ""}
                      onChange={(e) =>
                        onUpdateNode(selectedNode.id, {
                          style: { ...selectedNode.style, borderColor: e.target.value },
                        })
                      }
                      className="w-full text-xs font-mono text-slate-300 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Border Width
                    </label>
                    <select
                      value={selectedNode.style?.borderWidth ?? 1}
                      onChange={(e) =>
                        onUpdateNode(selectedNode.id, {
                          style: { ...selectedNode.style, borderWidth: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 outline-none"
                    >
                      <option value={1}>1px Normal</option>
                      <option value={2}>2px Bold</option>
                      <option value={3}>3px Heavy</option>
                    </select>
                  </div>
                </div>

                {/* Text Formatting */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Font Size
                    </label>
                    <select
                      value={selectedNode.style?.fontSize ?? 12}
                      onChange={(e) =>
                        onUpdateNode(selectedNode.id, {
                          style: { ...selectedNode.style, fontSize: Number(e.target.value) },
                        })
                      }
                      className="w-full text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 outline-none"
                    >
                      <option value={10}>10px Small</option>
                      <option value={12}>12px Normal</option>
                      <option value={14}>14px Medium</option>
                      <option value={16}>16px Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Alignment
                    </label>
                    <div className="flex rounded border border-slate-700 overflow-hidden bg-slate-900">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() =>
                            onUpdateNode(selectedNode.id, {
                              style: { ...selectedNode.style, textAlign: align },
                            })
                          }
                          className={`flex-1 py-1 text-[10px] uppercase font-semibold transition-colors ${
                            (selectedNode.style?.textAlign || "center") === align
                              ? "bg-blue-600 text-white"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {align[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Technical Description / Notes
                  </label>
                  <textarea
                    value={selectedNode.description || ""}
                    onChange={(e) => onUpdateNode(selectedNode.id, { description: e.target.value })}
                    rows={2}
                    placeholder="Details or sub-step specifications..."
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg p-2.5 outline-none resize-none"
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
                    className="text-[11px] font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
                  >
                    Delete Connection
                  </button>
                </div>

                {/* Routing Style */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Edge Routing Algorithm
                  </label>
                  <select
                    value={selectedEdge.routing || "smoothstep"}
                    onChange={(e) =>
                      onUpdateEdge(selectedEdge.id, {
                        routing: e.target.value as "smoothstep" | "step" | "straight" | "bezier",
                      })
                    }
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="smoothstep">Smooth Step (Orthogonal Curved)</option>
                    <option value="step">Sharp Step (Orthogonal 90°)</option>
                    <option value="bezier">Smooth Bezier Curve</option>
                    <option value="straight">Straight Direct Line</option>
                  </select>
                </div>

                {/* Branch Condition Label */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Branch Condition Label
                  </label>
                  <input
                    type="text"
                    value={selectedEdge.label || ""}
                    onChange={(e) => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
                    placeholder="e.g. Yes, No, Success, Failure..."
                    className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />

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
                <Sliders className="w-8 h-8 mx-auto text-slate-600 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-400">No element selected</p>
                <p className="text-[11px] leading-relaxed">
                  Click on any node or connection on the canvas to inspect, format colors, or change routing styles.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI EDITING WORKFLOW */}
        {activeTab === "aimod" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Conversational AI Editor</span>
              </div>
              <p className="text-[11px] text-purple-300/80 leading-relaxed">
                Tell Flowcraft what changes or branches to add without rebuilding the entire diagram from scratch.
              </p>
            </div>

            <form onSubmit={handleAiSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Edit Instruction
                </label>
                <textarea
                  rows={4}
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder="e.g. Add an error handling branch after payment failure with 3 retries, then alert customer..."
                  className="w-full text-xs text-slate-100 bg-slate-900 border border-slate-700 rounded-lg p-2.5 outline-none focus:border-purple-500 resize-none shadow-inner"
                />
              </div>

              {selectedNodesCount > 0 && (
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer p-2 bg-slate-900/60 rounded border border-slate-800">
                  <input
                    type="checkbox"
                    checked={onlySelectedScope}
                    onChange={(e) => setOnlySelectedScope(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>
                    Limit to {selectedNodesCount} selected node{selectedNodesCount > 1 ? "s" : ""}
                  </span>
                </label>
              )}

              <button
                type="submit"
                disabled={isAiModifying || !aiInstruction.trim()}
                className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                {isAiModifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Modifying Flowchart...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Apply AI Modification</span>
                  </>
                )}
              </button>
            </form>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Quick Example Edits
              </span>
              {[
                "Add an error handling branch after payment",
                "Add a retry loop when authentication fails",
                "Add missing No branches to the decision nodes",
                "Simplify diagram while preserving main logic",
              ].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setAiInstruction(ex)}
                  className="w-full text-left text-[11px] p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  &ldquo;{ex}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: ANALYSIS & STRUCTURAL AUDIT */}
        {activeTab === "analysis" && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-1">
                Overview & Summary
              </span>
              <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                {diagramSummary || "No summary provided for this diagram."}
              </p>
            </div>

            {diagramAssumptions.length > 0 && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Architectural Assumptions
                </span>
                <ul className="space-y-1 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {diagramAssumptions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Semantic Issues
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {validationWarnings.length}
                </span>
              </div>
              {validationWarnings.length === 0 ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Graph structure is fully valid and connected.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {validationWarnings.map((w, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-200 text-[11px]"
                    >
                      {w.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
