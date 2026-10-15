import React, { useState, useRef } from "react";
import {
  Workflow,
  RotateCcw,
  RotateCw,
  LayoutGrid,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Sparkles,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
} from "lucide-react";
import { LayoutDirection } from "@/lib/schema";

interface HeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  saveStatus: "saved" | "saving" | "unsaved";
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  layoutDirection: LayoutDirection;
  onToggleLayoutDirection: () => void;
  onClearCanvas: () => void;
  onImportJson: (file: File) => void;
  onExportPng: () => void;
  onExportSvg: () => void;
  onExportJson: () => void;
  onExportMermaid: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
  authRequired: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onTitleChange,
  saveStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAutoLayout,
  layoutDirection,
  onToggleLayoutDirection,
  onClearCanvas,
  onImportJson,
  onExportPng,
  onExportSvg,
  onExportJson,
  onExportMermaid,
  isDarkTheme,
  onToggleTheme,
  authRequired,
  onLogout,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim() && tempTitle !== title) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      e.target.value = "";
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 flex items-center justify-between select-none z-30">
      {/* Brand & Diagram Title */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-base tracking-tight shrink-0">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-sm">
            <Workflow className="w-4 h-4" />
          </div>
          <span>Flowcraft</span>
        </div>

        <div className="h-4 w-px bg-slate-800 shrink-0" />

        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTempTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="text-sm font-semibold text-slate-100 bg-slate-900 border border-blue-500/60 rounded px-2 py-0.5 outline-none w-64"
            />
          ) : (
            <h1
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename diagram"
              className="text-sm font-semibold text-slate-200 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-800/60 transition-colors truncate max-w-[220px] md:max-w-[340px]"
            >
              {title}
            </h1>
          )}

          {/* Autosave badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-2 shrink-0">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saved</span>
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Saving...</span>
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="flex items-center gap-1 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Unsaved changes</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-slate-400 hover:text-slate-100 disabled:opacity-40 disabled:hover:text-slate-400 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-slate-400 hover:text-slate-100 disabled:opacity-40 disabled:hover:text-slate-400 rounded transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Auto Layout & Direction */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={onAutoLayout}
            title="Run ELK Auto-Layout"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-400" />
            <span>Layout</span>
          </button>
          <button
            onClick={onToggleLayoutDirection}
            title={`Toggle Direction (Current: ${layoutDirection === "TB" ? "Top-to-Bottom" : "Left-to-Right"})`}
            className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 hover:text-slate-200 border-l border-slate-800 rounded-r transition-colors"
          >
            {layoutDirection}
          </button>
        </div>

        {/* Import JSON */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import JSON Project"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span>Export</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isExportOpen && (
            <div
              className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95"
              onMouseLeave={() => setIsExportOpen(false)}
            >
              <button
                onClick={() => {
                  onExportPng();
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between transition-colors"
              >
                <span>Export PNG (High-Res)</span>
                <span className="text-[10px] text-slate-500 font-mono">.png</span>
              </button>
              <button
                onClick={() => {
                  onExportSvg();
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between transition-colors"
              >
                <span>Export SVG</span>
                <span className="text-[10px] text-slate-500 font-mono">.svg</span>
              </button>
              <button
                onClick={() => {
                  onExportMermaid();
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between transition-colors"
              >
                <span>Export Mermaid</span>
                <span className="text-[10px] text-slate-500 font-mono">.mmd</span>
              </button>
              <div className="h-px bg-slate-800 my-1" />
              <button
                onClick={() => {
                  onExportJson();
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between transition-colors"
              >
                <span>Export Project JSON</span>
                <span className="text-[10px] text-slate-500 font-mono">.json</span>
              </button>
            </div>
          )}
        </div>

        {/* Clear Diagram */}
        <button
          onClick={onClearCanvas}
          title="Clear diagram"
          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-800 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={isDarkTheme ? "Switch to Light Canvas" : "Switch to Dark Canvas"}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
        >
          {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Logout (if authenticated) */}
        {authRequired && (
          <button
            onClick={onLogout}
            title="Log out of Flowcraft"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
