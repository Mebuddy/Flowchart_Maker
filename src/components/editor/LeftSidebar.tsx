import React, { useState } from "react";
import {
  Sparkles,
  Cpu,
  Binary,
  GitBranch,
  Copy,
  Trash2,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import { FlowProject, LayoutDirection } from "@/lib/schema";

interface LeftSidebarProps {
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  generationError: string | null;
  generationStage?: string | null;
  layoutDirection: LayoutDirection;
  onLayoutDirectionChange: (dir: LayoutDirection) => void;
  savedProjects: FlowProject[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onNewDiagram: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

const EXAMPLE_PROMPTS = [
  {
    title: "Embedded Control Loop",
    icon: <Cpu className="w-3.5 h-3.5 text-emerald-400" />,
    text: "Read the temperature sensor every second. If the temperature exceeds 40 degrees Celsius, turn on the cooling fan. Otherwise, keep the fan off. Repeat this process continuously.",
  },
  {
    title: "Binary Search Algorithm",
    icon: <Binary className="w-3.5 h-3.5 text-blue-400" />,
    text: "Initialize low to 0 and high to array length minus 1. While low is less than or equal to high, calculate the middle index. If the target equals the middle element, return the index. If the target is less than the middle element, set high to middle minus 1. Otherwise, set low to middle plus 1. If not found, return -1.",
  },
  {
    title: "Multi-Branch Approval",
    icon: <GitBranch className="w-3.5 h-3.5 text-purple-400" />,
    text: "An employee submits an expense report. If the amount is under $500, auto-approve the request. If the amount is between $500 and $5,000, send to the department manager for approval. If the manager rejects, notify the employee and terminate. If the amount exceeds $5,000, require VP and Finance approvals. Once all required approvals are obtained, reimburse the employee and log to accounting.",
  },
];

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  generationError,
  generationStage,
  layoutDirection,
  onLayoutDirectionChange,
  savedProjects,
  activeProjectId,
  onSelectProject,
  onDuplicateProject,
  onDeleteProject,
  onNewDiagram,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<"input" | "saved">("input");
  const charLimit = 12000;
  const charCount = prompt.length;
  const isOverLimit = charCount > charLimit;

  if (!isOpen) {
    return (
      <div className="relative z-20">
        <button
          onClick={onToggleOpen}
          title="Open Input Panel"
          className="absolute top-4 left-4 p-2 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded-lg shadow-xl hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-80 md:w-96 h-[calc(100vh-3.5rem)] bg-slate-950/95 border-r border-slate-800 flex flex-col z-20 shrink-0 select-none backdrop-blur-md">
      {/* Sidebar Tabs & Close */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("input")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === "input"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Prompt AI
          </button>
          <button
            onClick={() => setActiveTab("saved")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === "saved"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Saved</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {savedProjects.length}
            </span>
          </button>
        </div>

        <button
          onClick={onToggleOpen}
          title="Collapse Panel"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab 1: Input & Generation */}
      {activeTab === "input" && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
              <span>Natural-Language Description</span>
              <span
                className={`text-[11px] font-mono ${
                  isOverLimit ? "text-rose-400 font-bold" : "text-slate-500"
                }`}
              >
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder="e.g. Read temperature sensor every second. If temp > 40°C, turn on fan, otherwise keep fan off. Repeat continuously..."
              rows={7}
              className="w-full text-xs text-slate-200 bg-slate-900/90 border border-slate-700/80 rounded-lg p-3 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/80 resize-none font-sans leading-relaxed shadow-inner"
            />
          </div>

          {/* Layout Direction Selector */}
          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="font-medium text-slate-400">Layout Direction</span>
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
              <button
                type="button"
                onClick={() => onLayoutDirectionChange("TB")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  layoutDirection === "TB"
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Top-to-Bottom
              </button>
              <button
                type="button"
                onClick={() => onLayoutDirectionChange("LR")}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  layoutDirection === "LR"
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Left-to-Right
              </button>
            </div>
          </div>

          {/* Error message with manual retry */}
          {generationError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col gap-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div className="leading-relaxed break-words flex-1">{generationError}</div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-rose-500/20">
                <span className="text-[10px] text-rose-400/80">
                  {generationError.toLowerCase().includes("demand") || generationError.toLowerCase().includes("overload")
                    ? "Transient condition"
                    : "Action required"}
                </span>
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 rounded-md font-semibold text-[11px] transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? "animate-spin" : ""}`} />
                  <span>Retry Now</span>
                </button>
              </div>
            </div>
          )}

          {/* Generate Button with honest stage indicator */}
          <div className="space-y-2">
            <button
              onClick={onGenerate}
              disabled={isGenerating || prompt.trim() === "" || isOverLimit}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{generationStage || "Generating Flowchart..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>Generate Flowchart</span>
                </>
              )}
            </button>
            {isGenerating && (
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] flex items-center gap-2 animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                <span className="truncate">{generationStage || "Processing request..."}</span>
              </div>
            )}
          </div>

          {/* Quick Example Templates */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase block mb-2">
              Example Prompts
            </span>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example.title}
                  type="button"
                  onClick={() => onPromptChange(example.text)}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {example.icon}
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                      {example.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {example.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Saved Diagrams */}
      {activeTab === "saved" && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300">Your Diagrams</span>
            <button
              onClick={onNewDiagram}
              className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {savedProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No saved diagrams found.
            </div>
          ) : (
            savedProjects.map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive
                      ? "bg-blue-950/40 border-blue-500/50 shadow-md"
                      : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div
                    onClick={() => onSelectProject(p.id)}
                    className="cursor-pointer"
                  >
                    <div className="text-xs font-semibold text-slate-200 hover:text-white truncate">
                      {p.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                      {p.nodes.length} nodes · {p.edges.length} edges · {p.layoutDirection}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 mt-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => onDuplicateProject(p.id)}
                      title="Duplicate diagram"
                      className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      title="Delete diagram"
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </aside>
  );
};
