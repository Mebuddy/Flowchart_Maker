import React, { useState } from "react";
import {
  Download,
  X,
  FileImage,
  FileCode,
  Layers,
  Sparkles,
} from "lucide-react";

export interface ExportSettings {
  format: "png" | "svg" | "json" | "mermaid";
  scale: number;
  transparentBg: boolean;
  bgColor: string;
  scope: "all" | "selected";
  orientation: "auto" | "portrait" | "landscape";
  padding: number;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  hasSelection: boolean;
  selectedCount: number;
  onConfirmExport: (settings: ExportSettings) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  hasSelection,
  selectedCount,
  onConfirmExport,
}) => {
  const [format, setFormat] = useState<"png" | "svg" | "json" | "mermaid">("png");
  const [scale, setScale] = useState<number>(2);
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [bgColor, setBgColor] = useState<string>("#0B0F19");
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [padding, setPadding] = useState<number>(30);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Export Diagram</h3>
              <p className="text-[11px] text-slate-400">Configure resolution, background, and format</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {/* Format selection */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "png", label: "PNG", ext: ".png", desc: "Raster" },
                { id: "svg", label: "SVG", ext: ".svg", desc: "Vector" },
                { id: "json", label: "JSON", ext: ".json", desc: "Full Data" },
                { id: "mermaid", label: "MMD", ext: ".mmd", desc: "Mermaid" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as any)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    format === f.id
                      ? "bg-blue-600/30 border-blue-500 text-white shadow-sm"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[10px] text-slate-500">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Image-specific options */}
          {(format === "png" || format === "svg") && (
            <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 animate-in fade-in">
              {format === "png" && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Resolution Scale
                  </label>
                  <div className="flex gap-2">
                    {[
                      { scale: 1, label: "1x (Standard)" },
                      { scale: 2, label: "2x (Retina/High-Res)" },
                      { scale: 3, label: "3x (Ultra Print)" },
                    ].map((s) => (
                      <button
                        key={s.scale}
                        type="button"
                        onClick={() => setScale(s.scale)}
                        className={`flex-1 py-1 px-2 text-[11px] font-medium rounded border transition-colors ${
                          scale === s.scale
                            ? "bg-blue-600 text-white border-blue-500 font-semibold"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-400">
                  Transparent Background
                </label>
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              {!transparentBg && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 text-xs font-mono text-slate-200 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Margin / Padding ({padding}px)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Scope selection */}
          {hasSelection && (
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400">
                Scope:
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setScope("all")}
                  className={`px-2 py-1 text-[11px] rounded transition-colors ${
                    scope === "all" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Whole Diagram
                </button>
                <button
                  type="button"
                  onClick={() => setScope("selected")}
                  className={`px-2 py-1 text-[11px] rounded transition-colors ${
                    scope === "selected" ? "bg-blue-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Selected Only ({selectedCount})
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirmExport({
                format,
                scale,
                transparentBg,
                bgColor: transparentBg ? "transparent" : bgColor,
                scope,
                orientation: "auto",
                padding,
              });
              onClose();
            }}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
