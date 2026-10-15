import React, { useState } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  matchesCount: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  matchesCount,
  currentIndex,
  onNext,
  onPrev,
}) => {
  if (!isOpen) return null;

  return (
    <div className="flowcraft-exclude-export absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
      <Search className="w-4 h-4 text-blue-400 ml-1 shrink-0" />
      <input
        type="text"
        autoFocus
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.shiftKey) onPrev();
            else onNext();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        placeholder="Find node labels..."
        className="w-56 text-xs text-slate-100 bg-transparent outline-none placeholder-slate-500"
      />

      <span className="text-[11px] font-mono text-slate-400 px-1.5 border-l border-slate-800 shrink-0">
        {matchesCount > 0 ? `${currentIndex + 1}/${matchesCount}` : query ? "0 results" : "Type to find"}
      </span>

      <div className="flex items-center gap-0.5 border-l border-slate-800 pl-1 shrink-0">
        <button
          onClick={onPrev}
          disabled={matchesCount === 0}
          title="Previous match (Shift+Enter)"
          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onNext}
          disabled={matchesCount === 0}
          title="Next match (Enter)"
          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          title="Close search (Esc)"
          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
