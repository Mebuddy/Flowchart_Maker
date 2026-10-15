import React from "react";
import {
  Keyboard,
  X,
  CornerDownLeft,
  Command,
} from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    category: "Selection & Navigation",
    shortcuts: [
      { keys: ["Ctrl/⌘", "A"], desc: "Select all diagram elements" },
      { keys: ["Shift", "Click"], desc: "Add / remove node from selection" },
      { keys: ["Drag"], desc: "Box selection area across canvas" },
      { keys: ["Escape"], desc: "Deselect elements or dismiss panels" },
      { keys: ["Ctrl/⌘", "F"], desc: "Open diagram search" },
    ],
  },
  {
    category: "Editing & Clipboard",
    shortcuts: [
      { keys: ["Double Click"], desc: "Edit node label or edge label inline" },
      { keys: ["Ctrl/⌘", "D"], desc: "Duplicate selection with connections" },
      { keys: ["Delete / Backspace"], desc: "Delete selected nodes or edges" },
      { keys: ["Ctrl/⌘", "Z"], desc: "Undo last diagram change" },
      { keys: ["Ctrl/⌘", "Y"], desc: "Redo change (or ⌘+Shift+Z)" },
      { keys: ["Ctrl/⌘", "S"], desc: "Save current diagram immediately" },
    ],
  },
  {
    category: "Canvas & Viewport",
    shortcuts: [
      { keys: ["Scroll / Pinch"], desc: "Zoom in and out of canvas" },
      { keys: ["Space + Drag"], desc: "Pan canvas view" },
      { keys: ["Right Click"], desc: "Open element / canvas context menu" },
      { keys: ["L"], desc: "Recompute auto layout (ELK.js)" },
    ],
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Keyboard Shortcuts & Gestures</h3>
              <p className="text-[11px] text-slate-400">Master Flowcraft with keyboard-driven productivity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {group.category}
              </span>
              <div className="space-y-1.5">
                {group.shortcuts.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80"
                  >
                    <span className="text-slate-300 text-[11px]">{s.desc}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map((k, ki) => (
                        <kbd
                          key={ki}
                          className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-800 text-slate-200 border border-slate-700 rounded shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition-all active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
