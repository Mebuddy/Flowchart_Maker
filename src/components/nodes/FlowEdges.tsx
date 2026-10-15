import React, { memo, useState, useRef, useEffect } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  getStraightPath,
  getBezierPath,
} from "@xyflow/react";

export const CustomFlowEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    selected,
    data,
  }: EdgeProps) => {
    const edgeData = data as {
      routing?: "smoothstep" | "step" | "straight" | "bezier";
      onLabelChange?: (id: string, newLabel: string) => void;
      strokeColor?: string;
    } | undefined;

    const routing = edgeData?.routing || "smoothstep";
    let edgePath = "";
    let labelX = 0;
    let labelY = 0;

    if (routing === "straight") {
      [edgePath, labelX, labelY] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
      });
    } else if (routing === "bezier") {
      [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      });
    } else if (routing === "step") {
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 0,
      });
    } else {
      // Default smoothstep
      [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 10,
      });
    }

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState((label as string) || "");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setEditValue((label as string) || "");
    }, [label]);

    useEffect(() => {
      if (isEditing) {
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }, [isEditing]);

    const labelStr = typeof label === "string" ? label.toLowerCase() : "";
    const isYes = labelStr === "yes" || labelStr === "true" || labelStr === "success";
    const isNo = labelStr === "no" || labelStr === "false" || labelStr === "failure";

    const strokeColor = selected
      ? "#60A5FA"
      : edgeData?.strokeColor || (style.stroke as string) || "#64748B";

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: strokeColor,
            strokeWidth: selected ? 2.5 : 1.75,
            transition: "stroke 0.2s, stroke-width 0.2s",
          }}
        />
        {(label || isEditing || selected) && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
              className="nodrag-ui"
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setIsEditing(false);
                      edgeData?.onLabelChange?.(id, editValue.trim());
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setIsEditing(false);
                      setEditValue((label as string) || "");
                    }
                  }}
                  onBlur={() => {
                    setIsEditing(false);
                    edgeData?.onLabelChange?.(id, editValue.trim());
                  }}
                  className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-blue-300 border border-blue-400 outline-none shadow-md w-20 text-center"
                />
              ) : label ? (
                <div
                  onDoubleClick={() => setIsEditing(true)}
                  title="Double click to edit branch condition label"
                  className={`cursor-pointer px-2 py-0.5 rounded text-[11px] font-semibold border shadow-sm transition-all select-none ${
                    isYes
                      ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50"
                      : isNo
                      ? "bg-rose-950/90 text-rose-300 border-rose-500/50"
                      : "bg-slate-900/90 text-slate-300 border-slate-700 hover:border-slate-500"
                  } ${selected ? "ring-2 ring-blue-400 scale-105" : ""}`}
                >
                  {label}
                </div>
              ) : selected ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all opacity-70 hover:opacity-100"
                >
                  + Label
                </button>
              ) : null}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

CustomFlowEdge.displayName = "CustomFlowEdge";

export const edgeTypes = {
  custom: CustomFlowEdge,
  smoothstep: CustomFlowEdge,
  step: CustomFlowEdge,
  straight: CustomFlowEdge,
  bezier: CustomFlowEdge,
};
