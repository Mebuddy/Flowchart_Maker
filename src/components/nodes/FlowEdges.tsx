import React, { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
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
  }: EdgeProps) => {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 8,
    });

    const labelStr = typeof label === "string" ? label.toLowerCase() : "";
    const isYes = labelStr === "yes" || labelStr === "true" || labelStr === "success";
    const isNo = labelStr === "no" || labelStr === "false" || labelStr === "failure";

    return (
      <>
        <BaseEdge
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: selected ? "#60A5FA" : "#64748B",
            strokeWidth: selected ? 2.5 : 1.75,
            transition: "stroke 0.2s, stroke-width 0.2s",
          }}
        />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
              className={`nodrag-ui px-2 py-0.5 rounded text-[11px] font-semibold border shadow-sm transition-all ${
                isYes
                  ? "bg-emerald-950/90 text-emerald-300 border-emerald-500/50"
                  : isNo
                  ? "bg-rose-950/90 text-rose-300 border-rose-500/50"
                  : "bg-slate-900/90 text-slate-300 border-slate-700"
              } ${selected ? "ring-1 ring-blue-400" : ""}`}
            >
              {label}
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
};
