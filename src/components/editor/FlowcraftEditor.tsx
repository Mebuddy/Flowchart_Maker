"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
  BackgroundVariant,
  ReactFlowInstance,
  reconnectEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes, CustomNodeData } from "@/components/nodes/FlowNodes";
import { edgeTypes } from "@/components/nodes/FlowEdges";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { Toolbar } from "./Toolbar";
import { ConfirmationModal } from "./ConfirmationModal";
import { ExportModal, ExportSettings } from "./ExportModal";
import { ShortcutsModal } from "./ShortcutsModal";
import { SearchBar } from "./SearchBar";
import { ContextMenu } from "./ContextMenu";

import {
  FlowProject,
  LayoutDirection,
  NodeType,
  FlowNode,
  FlowEdge,
  DiagramPreset,
  NodeStyle,
} from "@/lib/schema";
import { calculateAutoLayout, PositionedNode } from "@/lib/layout";
import { DIAGRAM_PRESETS } from "@/lib/presets";
import {
  getStoredProjects,
  saveProject,
  getActiveProjectId,
  setActiveProjectId,
  deleteProject as deleteStoredProject,
  duplicateProject as duplicateStoredProject,
  SAMPLE_PROJECTS,
} from "@/lib/storage";
import {
  exportProjectToJson,
  exportProjectToMermaid,
  exportCanvasToImage,
  parseAndValidateImport,
} from "@/lib/export";
import { parseMermaidCode } from "@/lib/mermaid-parser";
import { validateGraphSemantics, ValidationIssue } from "@/lib/validation";

interface FlowcraftEditorProps {
  authRequired: boolean;
  onLogout: () => void;
}

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

export const FlowcraftEditor: React.FC<FlowcraftEditorProps> = ({
  authRequired,
  onLogout,
}) => {
  // 1. Projects & Active Project State
  const [projects, setProjects] = useState<FlowProject[]>([]);
  const [activeProject, setActiveProject] = useState<FlowProject | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // 2. React Flow Canvas State
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  // 3. UI and Panel State
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isAiModifying, setIsAiModifying] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<ValidationIssue[]>([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // 4. Interactive Canvas Settings
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [currentPreset, setCurrentPreset] = useState<DiagramPreset>("default");

  // 5. Selection State
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);

  // 6. Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "node" | "edge" | "canvas";
    targetId?: string;
  } | null>(null);

  // 7. Search & Navigate State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // 8. Undo/Redo State
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Helper to push snapshot
  const pushHistory = useCallback(
    (newNodes: Node[], newEdges: Edge[]) => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        return [...upToCurrent, { nodes: newNodes, edges: newEdges }].slice(-50);
      });
      setHistoryIndex((prev) => prev + 1);
      setSaveStatus("unsaved");
    },
    [historyIndex]
  );

  const activeProjectRef = useRef<FlowProject | null>(activeProject);
  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  // Load project into editor canvas
  const loadProjectIntoEditor = useCallback(
    (project: FlowProject) => {
      setActiveProject(project);
      setActiveProjectId(project.id);
      setPrompt(project.originalPrompt || "");
      setCurrentPreset(project.preset || "default");

      const rfNodes: Node[] = project.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.label,
          type: n.type,
          description: n.description,
          style: n.style,
          preset: project.preset || "default",
        },
      }));

      const rfEdges: Edge[] = project.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        label: e.label,
        type: e.routing || "custom",
        data: {
          routing: e.routing || "smoothstep",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#64748B",
        },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);

      const vResult = validateGraphSemantics({
        title: project.title,
        summary: project.summary,
        assumptions: project.assumptions,
        nodes: project.nodes,
        edges: project.edges,
      });
      setValidationWarnings(vResult.warnings);

      setHistory([{ nodes: rfNodes, edges: rfEdges }]);
      setHistoryIndex(0);
      setSaveStatus("saved");

      setTimeout(() => {
        rfInstance?.fitView({ padding: 0.2 });
      }, 100);
    },
    [rfInstance, setEdges, setNodes]
  );

  // Load projects on initial mount
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    setProjects(loadedProjects);

    const activeId = getActiveProjectId();
    const current =
      loadedProjects.find((p) => p.id === activeId) ||
      loadedProjects[0] ||
      SAMPLE_PROJECTS[0];
    loadProjectIntoEditor(current);
  }, [loadProjectIntoEditor]);

  // Debounced Autosave
  useEffect(() => {
    const currentActive = activeProjectRef.current;
    if (!currentActive) return;

    setSaveStatus("saving");
    const timeout = setTimeout(() => {
      const updatedNodes = nodes.map((n) => ({
        id: n.id,
        type: ((n.data as unknown as CustomNodeData)?.type || n.type || "process") as NodeType,
        label: (n.data as unknown as CustomNodeData)?.label || "Node",
        description: (n.data as unknown as CustomNodeData)?.description,
        style: (n.data as unknown as CustomNodeData)?.style,
        position: n.position,
      }));

      const updatedEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? undefined,
        targetHandle: e.targetHandle ?? undefined,
        label: (e.label as string) || undefined,
        routing: (e.data as any)?.routing,
      }));

      const updatedProject: FlowProject = {
        ...currentActive,
        originalPrompt: prompt,
        preset: currentPreset,
        nodes: updatedNodes,
        edges: updatedEdges,
        updatedAt: new Date().toISOString(),
      };

      saveProject(updatedProject);
      setActiveProject(updatedProject);
      setProjects(getStoredProjects());
      setSaveStatus("saved");

      const vResult = validateGraphSemantics({
        title: updatedProject.title,
        summary: updatedProject.summary,
        assumptions: updatedProject.assumptions,
        nodes: updatedNodes,
        edges: updatedEdges,
      });
      setValidationWarnings(vResult.warnings);
    }, 800);

    return () => clearTimeout(timeout);
  }, [nodes, edges, prompt, currentPreset]);

  // Connect new edge
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) {
        return; // Prevent self-loops or empty endpoints
      }

      const newEdge: Edge = {
        id: `e_${params.source}_${params.target}_${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle ?? undefined,
        targetHandle: params.targetHandle ?? undefined,
        type: "custom",
        data: { routing: "smoothstep" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#64748B",
        },
      };
      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        pushHistory(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, pushHistory]
  );

  // Reconnect edge to different node/handle
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => {
        const next = reconnectEdge(oldEdge, newConnection, els);
        pushHistory(nodes, next);
        return next;
      });
    },
    [nodes, setEdges, pushHistory]
  );

  // Node & Edge Deletion with dangling reference prevention
  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      const deletedIds = new Set(deletedNodes.map((n) => n.id));
      const nextEdges = edges.filter(
        (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
      );
      const nextNodes = nodes.filter((n) => !deletedIds.has(n.id));
      setEdges(nextEdges);
      setNodes(nextNodes);
      setSelectedNodeIds((prev) => prev.filter((id) => !deletedIds.has(id)));
      pushHistory(nextNodes, nextEdges);
    },
    [edges, nodes, setEdges, setNodes, pushHistory]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      const deletedIds = new Set(deletedEdges.map((e) => e.id));
      const nextEdges = edges.filter((e) => !deletedIds.has(e.id));
      setEdges(nextEdges);
      setSelectedEdgeIds((prev) => prev.filter((id) => !deletedIds.has(id)));
      pushHistory(nodes, nextEdges);
    },
    [edges, nodes, setEdges, pushHistory]
  );

  // Undo / Redo Handlers
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex - 1;
      const snapshot = history[targetIndex];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetIndex = historyIndex + 1;
      const snapshot = history[targetIndex];
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
      setHistoryIndex(targetIndex);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Duplicate Selection (with internal edges remapped)
  const handleDuplicateSelection = useCallback(() => {
    if (selectedNodeIds.length === 0) return;

    const idMap = new Map<string, string>();
    const timestamp = Date.now();

    const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
    const newNodes: Node[] = selectedNodes.map((n, idx) => {
      const newId = `node_${timestamp}_${idx}`;
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: {
          x: n.position.x + 40,
          y: n.position.y + 40,
        },
        selected: true,
      };
    });

    // Remap internal edges connecting duplicated nodes
    const internalEdges = edges.filter(
      (e) => idMap.has(e.source) && idMap.has(e.target)
    );
    const newEdges: Edge[] = internalEdges.map((e, idx) => ({
      ...e,
      id: `e_${idMap.get(e.source)}_${idMap.get(e.target)}_${timestamp}_${idx}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }));

    const unselectedOldNodes = nodes.map((n) => ({ ...n, selected: false }));
    const nextNodes = [...unselectedOldNodes, ...newNodes];
    const nextEdges = [...edges, ...newEdges];

    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeIds(Array.from(idMap.values()));
    pushHistory(nextNodes, nextEdges);
  }, [nodes, edges, selectedNodeIds, setNodes, setEdges, pushHistory]);

  // Select All Elements
  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: true })));
    setSelectedNodeIds(nodes.map((n) => n.id));
    setSelectedEdgeIds(edges.map((e) => e.id));
  }, [nodes, edges, setNodes, setEdges]);

  // Deselect All Elements
  const handleDeselectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setContextMenu(null);
    setIsSearchOpen(false);
  }, [setNodes, setEdges]);

  // Align Selected Nodes
  const handleAlign = useCallback(
    (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom" | "distributeHoriz" | "distributeVert") => {
      const selected = nodes.filter((n) => selectedNodeIds.includes(n.id));
      if (selected.length < 2) return;

      const minX = Math.min(...selected.map((n) => n.position.x));
      const maxX = Math.max(...selected.map((n) => n.position.x + (n.measured?.width || 180)));
      const minY = Math.min(...selected.map((n) => n.position.y));
      const maxY = Math.max(...selected.map((n) => n.position.y + (n.measured?.height || 70)));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const alignedNodes = nodes.map((n) => {
        if (!selectedNodeIds.includes(n.id)) return n;
        const w = n.measured?.width || 180;
        const h = n.measured?.height || 70;

        let posX = n.position.x;
        let posY = n.position.y;

        switch (alignment) {
          case "left":
            posX = minX;
            break;
          case "center":
            posX = centerX - w / 2;
            break;
          case "right":
            posX = maxX - w;
            break;
          case "top":
            posY = minY;
            break;
          case "middle":
            posY = centerY - h / 2;
            break;
          case "bottom":
            posY = maxY - h;
            break;
        }

        return { ...n, position: { x: posX, y: posY } };
      });

      setNodes(alignedNodes);
      pushHistory(alignedNodes, edges);
    },
    [nodes, edges, selectedNodeIds, setNodes, pushHistory]
  );

  // Automatic Layout
  const handleAutoLayout = useCallback(async () => {
    if (!activeProject || nodes.length === 0) return;

    const flowNodes: FlowNode[] = nodes.map((n) => ({
      id: n.id,
      type: ((n.data as unknown as CustomNodeData)?.type || n.type || "process") as NodeType,
      label: (n.data as unknown as CustomNodeData)?.label || "Node",
      description: (n.data as unknown as CustomNodeData)?.description,
      style: (n.data as unknown as CustomNodeData)?.style,
    }));

    const flowEdges: FlowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: (e.label as string) || undefined,
      routing: (e.data as any)?.routing,
    }));

    const layoutResult = await calculateAutoLayout(
      flowNodes,
      flowEdges,
      activeProject.layoutDirection
    );

    const layoutedRfNodes: Node[] = layoutResult.nodes.map((n) => {
      const existing = nodes.find((orig) => orig.id === n.id);
      return {
        ...existing,
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.label,
          type: n.type,
          description: n.description,
          style: n.style,
          preset: currentPreset,
        },
      };
    });

    setNodes(layoutedRfNodes);
    pushHistory(layoutedRfNodes, edges);

    setTimeout(() => {
      rfInstance?.fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [activeProject, nodes, edges, rfInstance, setNodes, pushHistory, currentPreset]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z / Cmd+Z
      if (cmdOrCtrl && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y / Cmd+Shift+Z / Ctrl+Shift+Z
      else if ((cmdOrCtrl && e.key.toLowerCase() === "y") || (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        handleRedo();
      }
      // Select All: Ctrl+A / Cmd+A
      else if (cmdOrCtrl && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleSelectAll();
      }
      // Duplicate: Ctrl+D / Cmd+D
      else if (cmdOrCtrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicateSelection();
      }
      // Save: Ctrl+S / Cmd+S
      else if (cmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (activeProject) saveProject(activeProject);
        setSaveStatus("saved");
      }
      // Search: Ctrl+F / Cmd+F
      else if (cmdOrCtrl && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Escape: Deselect / Close Modals
      else if (e.key === "Escape") {
        handleDeselectAll();
      }
      // Delete / Backspace: Delete selected
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeIds.length > 0 || selectedEdgeIds.length > 0) {
          e.preventDefault();
          const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
          const selectedEdges = edges.filter((e) => selectedEdgeIds.includes(e.id));
          if (selectedNodes.length > 0) onNodesDelete(selectedNodes);
          if (selectedEdges.length > 0) onEdgesDelete(selectedEdges);
        }
      }
      // Layout shortcut: L
      else if (e.key.toLowerCase() === "l" && !cmdOrCtrl) {
        e.preventDefault();
        handleAutoLayout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleSelectAll,
    handleDuplicateSelection,
    handleDeselectAll,
    selectedNodeIds,
    selectedEdgeIds,
    nodes,
    edges,
    onNodesDelete,
    onEdgesDelete,
    handleAutoLayout,
    activeProject,
  ]);

  // Diagram Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchMatches([]);
      setSearchMatchIndex(0);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: { ...n.data, isSearchMatch: false, isSearchActive: false },
        }))
      );
      return;
    }

    const q = searchQuery.toLowerCase();
    const matches = nodes.filter((n) =>
      ((n.data as any)?.label || "").toLowerCase().includes(q)
    );
    const matchIds = matches.map((m) => m.id);
    setSearchMatches(matchIds);
    setSearchMatchIndex(0);

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSearchMatch: matchIds.includes(n.id),
          isSearchActive: matchIds[0] === n.id,
        },
      }))
    );

    if (matches.length > 0 && rfInstance) {
      const activeMatch = matches[0];
      rfInstance.setCenter(
        activeMatch.position.x + 90,
        activeMatch.position.y + 40,
        { zoom: 1.2, duration: 400 }
      );
    }
  }, [searchQuery, nodes, rfInstance, setNodes]);

  const handleSearchNext = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (searchMatchIndex + 1) % searchMatches.length;
    setSearchMatchIndex(nextIdx);
    const targetId = searchMatches[nextIdx];

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSearchActive: n.id === targetId,
        },
      }))
    );

    const targetNode = nodes.find((n) => n.id === targetId);
    if (targetNode && rfInstance) {
      rfInstance.setCenter(
        targetNode.position.x + 90,
        targetNode.position.y + 40,
        { zoom: 1.2, duration: 400 }
      );
    }
  };

  const handleSearchPrev = () => {
    if (searchMatches.length === 0) return;
    const prevIdx =
      (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchMatchIndex(prevIdx);
    const targetId = searchMatches[prevIdx];

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSearchActive: n.id === targetId,
        },
      }))
    );

    const targetNode = nodes.find((n) => n.id === targetId);
    if (targetNode && rfInstance) {
      rfInstance.setCenter(
        targetNode.position.x + 90,
        targetNode.position.y + 40,
        { zoom: 1.2, duration: 400 }
      );
    }
  };



  // Toggle layout direction (TB <-> LR)
  const handleToggleLayoutDirection = () => {
    if (!activeProject) return;
    const nextDir: LayoutDirection = activeProject.layoutDirection === "TB" ? "LR" : "TB";
    setActiveProject((prev) => (prev ? { ...prev, layoutDirection: nextDir } : null));
    setTimeout(() => {
      handleAutoLayout();
    }, 50);
  };

  // Switch visual preset
  const handleSelectPreset = (preset: DiagramPreset) => {
    setCurrentPreset(preset);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          preset,
        },
      }))
    );
  };

  // Add Node from Toolbar
  const handleAddNode = (type: NodeType, label: string) => {
    const id = `node_${Date.now()}`;
    const position = rfInstance
      ? rfInstance.screenToFlowPosition({
          x: window.innerWidth / 2 - 80,
          y: window.innerHeight / 2 - 40,
        })
      : { x: 250, y: 150 };

    const newNode: Node = {
      id,
      type,
      position,
      data: {
        label,
        type,
        preset: currentPreset,
      },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeIds([id]);
    setSelectedEdgeIds([]);
    pushHistory(nextNodes, edges);
  };

  // Update Node properties
  const handleUpdateNode = (
    id: string,
    updates: { label?: string; type?: NodeType; description?: string; style?: NodeStyle }
  ) => {
    setNodes((nds) => {
      const next = nds.map((n) => {
        if (n.id === id) {
          const currentData = n.data as unknown as CustomNodeData;
          return {
            ...n,
            type: updates.type || n.type,
            data: {
              ...currentData,
              label: updates.label !== undefined ? updates.label : currentData.label,
              type: updates.type || currentData.type,
              description:
                updates.description !== undefined ? updates.description : currentData.description,
              style: updates.style !== undefined ? updates.style : currentData.style,
            },
          };
        }
        return n;
      });
      pushHistory(next, edges);
      return next;
    });
  };

  // Update Edge properties
  const handleUpdateEdge = (
    id: string,
    updates: { label?: string; routing?: "smoothstep" | "step" | "straight" | "bezier" }
  ) => {
    setEdges((eds) => {
      const next = eds.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            label: updates.label !== undefined ? updates.label : e.label,
            type: updates.routing || e.type,
            data: {
              ...(e.data as any),
              routing: updates.routing !== undefined ? updates.routing : (e.data as any)?.routing,
            },
          };
        }
        return e;
      });
      pushHistory(nodes, next);
      return next;
    });
  };

  // Selection change
  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      setSelectedNodeIds(selNodes.map((n) => n.id));
      setSelectedEdgeIds(selEdges.map((e) => e.id));
    },
    []
  );

  // Clear Canvas
  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeIds([]);
    setSelectedEdgeIds([]);
    setIsClearModalOpen(false);
    pushHistory([], []);
  };

  // AI Flowchart Generation from Scratch
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setGenerationStage("Connecting to AI model...");
    setGenerationError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerationError(data.error || "Generation failed.");
        return;
      }

      setGenerationStage("Computing diagram layout...");
      const generatedGraph = data.graph;
      const layoutResult = await calculateAutoLayout(
        generatedGraph.nodes,
        generatedGraph.edges,
        activeProject?.layoutDirection || "TB"
      );

      setGenerationStage("Rendering flowchart...");
      const rfNodes: Node[] = layoutResult.nodes.map((n: PositionedNode) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.label,
          type: n.type,
          description: n.description,
          preset: currentPreset,
        },
      }));

      const rfEdges: Edge[] = layoutResult.edges.map((e: FlowEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "custom",
        data: { routing: "smoothstep" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#64748B",
        },
      }));

      const updatedProject: FlowProject = {
        version: 1,
        id: activeProject?.id || `project_${Date.now()}`,
        title: generatedGraph.title || "Generated Diagram",
        summary: generatedGraph.summary || "",
        assumptions: generatedGraph.assumptions || [],
        originalPrompt: prompt,
        layoutDirection: activeProject?.layoutDirection || "TB",
        preset: currentPreset,
        nodes: layoutResult.nodes,
        edges: layoutResult.edges,
        createdAt: activeProject?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setActiveProject(updatedProject);
      saveProject(updatedProject);
      setProjects(getStoredProjects());

      setNodes(rfNodes);
      setEdges(rfEdges);
      setValidationWarnings(data.validation?.warnings || []);
      pushHistory(rfNodes, rfEdges);

      setTimeout(() => {
        rfInstance?.fitView({ padding: 0.2, duration: 400 });
      }, 100);
    } catch {
      setGenerationError("Network error while connecting to generation API.");
    } finally {
      setIsGenerating(false);
      setGenerationStage(null);
    }
  };

  // Conversational AI Edit of existing diagram
  const handleAiModify = async (instruction: string, onlySelected: boolean) => {
    if (!instruction.trim() || isAiModifying) return;

    setIsAiModifying(true);
    try {
      const currentGraph = {
        title: activeProject?.title || "Diagram",
        summary: activeProject?.summary || "",
        assumptions: activeProject?.assumptions || [],
        nodes: nodes.map((n) => ({
          id: n.id,
          type: ((n.data as any)?.type || n.type) as NodeType,
          label: (n.data as any)?.label || "Node",
          description: (n.data as any)?.description,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: (e.label as string) || undefined,
        })),
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "modify",
          instruction,
          currentGraph,
          selectedNodeIds: onlySelected ? selectedNodeIds : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "AI modification failed.");
        return;
      }

      const modifiedGraph = data.graph;
      const layoutResult = await calculateAutoLayout(
        modifiedGraph.nodes,
        modifiedGraph.edges,
        activeProject?.layoutDirection || "TB"
      );

      const rfNodes: Node[] = layoutResult.nodes.map((n: PositionedNode) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.label,
          type: n.type,
          description: n.description,
          preset: currentPreset,
        },
      }));

      const rfEdges: Edge[] = layoutResult.edges.map((e: FlowEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "custom",
        data: { routing: "smoothstep" },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#64748B",
        },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
      pushHistory(rfNodes, rfEdges);

      setTimeout(() => {
        rfInstance?.fitView({ padding: 0.2, duration: 400 });
      }, 100);
    } catch {
      alert("Network error during AI modification.");
    } finally {
      setIsAiModifying(false);
    }
  };

  // Project Management Handlers
  const handleNewDiagram = () => {
    const newProj: FlowProject = {
      version: 1,
      id: `project_${Date.now()}`,
      title: "Untitled Flowchart",
      summary: "",
      assumptions: [],
      originalPrompt: "",
      layoutDirection: "TB",
      preset: currentPreset,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveProject(newProj);
    setProjects(getStoredProjects());
    loadProjectIntoEditor(newProj);
  };

  const handleDuplicateProject = (id: string) => {
    const duplicated = duplicateStoredProject(id);
    if (duplicated) {
      setProjects(getStoredProjects());
      loadProjectIntoEditor(duplicated);
    }
  };

  const handleDeleteProject = (id: string) => {
    const remaining = deleteStoredProject(id);
    setProjects(remaining);
    if (activeProject?.id === id && remaining.length > 0) {
      loadProjectIntoEditor(remaining[0]);
    }
  };

  const handleRenameProject = (id: string, newTitle: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      const updated = { ...project, title: newTitle, updatedAt: new Date().toISOString() };
      saveProject(updated);
      setProjects(getStoredProjects());
      if (activeProject?.id === id) {
        setActiveProject(updated);
      }
    }
  };

  // Import JSON project
  const handleImportJson = async (file: File) => {
    const text = await file.text();
    const result = parseAndValidateImport(text);
    if (!result.success || !result.project) {
      alert(result.error || "Failed to validate imported project file.");
      return;
    }
    saveProject(result.project);
    setProjects(getStoredProjects());
    loadProjectIntoEditor(result.project);
  };

  // Import Mermaid script
  const handleImportMermaid = async (code: string) => {
    const result = parseMermaidCode(code);
    if (!result.success || !result.graph) {
      alert(result.error || "Failed to parse Mermaid flowchart code.");
      return;
    }

    const parsed = result.graph;
    const layoutResult = await calculateAutoLayout(parsed.nodes, parsed.edges, parsed.direction);

    const importedProj: FlowProject = {
      version: 1,
      id: `project_mmd_${Date.now()}`,
      title: parsed.title,
      summary: "Imported from Mermaid flowchart",
      assumptions: [],
      originalPrompt: "",
      layoutDirection: parsed.direction,
      preset: currentPreset,
      nodes: layoutResult.nodes,
      edges: layoutResult.edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProject(importedProj);
    setProjects(getStoredProjects());
    loadProjectIntoEditor(importedProj);
  };

  // Comprehensive Export Modal Handler
  const handleConfirmExport = async (settings: ExportSettings) => {
    if (!activeProject) return;

    if (settings.format === "json") {
      exportProjectToJson(activeProject);
    } else if (settings.format === "mermaid") {
      exportProjectToMermaid(activeProject);
    } else if (flowContainerRef.current) {
      const viewportEl = flowContainerRef.current.querySelector(
        ".react-flow__viewport"
      ) as HTMLElement;
      const targetElement = viewportEl || flowContainerRef.current;

      await exportCanvasToImage(
        targetElement,
        settings.format,
        activeProject.title,
        settings.bgColor,
        { scale: settings.scale, padding: settings.padding }
      );
    }
  };

  // Node Drag Stop -> records ONE clean history snapshot per drag
  const onNodeDragStop = useCallback(() => {
    pushHistory(nodes, edges);
  }, [nodes, edges, pushHistory]);

  // Context Menu Trigger Handlers
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: "node",
      targetId: node.id,
    });
    setSelectedNodeIds([node.id]);
  }, []);

  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: "edge",
      targetId: edge.id,
    });
    setSelectedEdgeIds([edge.id]);
  }, []);

  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: "canvas",
    });
  }, []);

  // Selected elements for sidebar inspector
  const primarySelectedNode = useMemo(() => {
    if (selectedNodeIds.length === 0) return null;
    const target = nodes.find((n) => n.id === selectedNodeIds[0]);
    if (!target) return null;
    const data = target.data as unknown as CustomNodeData;
    return {
      id: target.id,
      type: ((data?.type || target.type || "process") as NodeType),
      label: data?.label || "Node",
      description: data?.description,
      style: data?.style,
    };
  }, [nodes, selectedNodeIds]);

  const primarySelectedEdge = useMemo(() => {
    if (selectedEdgeIds.length === 0) return null;
    const target = edges.find((e) => e.id === selectedEdgeIds[0]);
    if (!target) return null;
    return {
      id: target.id,
      source: target.source,
      target: target.target,
      label: (target.label as string) || undefined,
      routing: (target.data as any)?.routing,
    };
  }, [edges, selectedEdgeIds]);

  return (
    <div
      onClick={() => setContextMenu(null)}
      className={`h-screen w-screen flex flex-col overflow-hidden ${
        isDarkTheme ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Header */}
      <Header
        title={activeProject?.title || "Untitled Diagram"}
        onTitleChange={(title) => {
          if (activeProject) {
            setActiveProject((prev) => (prev ? { ...prev, title } : null));
          }
        }}
        saveStatus={saveStatus}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAutoLayout={handleAutoLayout}
        layoutDirection={activeProject?.layoutDirection || "TB"}
        onToggleLayoutDirection={handleToggleLayoutDirection}
        onClearCanvas={() => setIsClearModalOpen(true)}
        onImportJson={handleImportJson}
        onImportMermaid={handleImportMermaid}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        authRequired={authRequired}
        onLogout={onLogout}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel */}
        <LeftSidebar
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          generationStage={generationStage}
          generationError={generationError}
          layoutDirection={activeProject?.layoutDirection || "TB"}
          onLayoutDirectionChange={(dir) => {
            if (activeProject) {
              setActiveProject((prev) => (prev ? { ...prev, layoutDirection: dir } : null));
            }
          }}
          savedProjects={projects}
          activeProjectId={activeProject?.id || null}
          onSelectProject={(id) => {
            const target = projects.find((p) => p.id === id);
            if (target) loadProjectIntoEditor(target);
          }}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
          onNewDiagram={handleNewDiagram}
          isOpen={leftOpen}
          onToggleOpen={() => setLeftOpen(!leftOpen)}
        />

        {/* Center Canvas */}
        <div
          ref={flowContainerRef}
          className={`flex-1 h-full relative overflow-hidden transition-colors duration-200 ${
            isDarkTheme ? "bg-[#0B0F19]" : "bg-slate-100"
          }`}
        >
          {/* Top Floating Toolbar */}
          <Toolbar
            onAddNode={handleAddNode}
            selectedNodesCount={selectedNodeIds.length}
            onAlign={handleAlign}
            snapToGrid={snapToGrid}
            onToggleSnapToGrid={() => setSnapToGrid(!snapToGrid)}
            isLocked={isCanvasLocked}
            onToggleLock={() => setIsCanvasLocked(!isCanvasLocked)}
            currentPreset={currentPreset}
            onSelectPreset={handleSelectPreset}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          {/* Diagram Search Bar */}
          <SearchBar
            isOpen={isSearchOpen}
            onClose={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
            }}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            matchesCount={searchMatches.length}
            currentIndex={searchMatchIndex}
            onNext={handleSearchNext}
            onPrev={handleSearchPrev}
          />

          {/* Context Menu */}
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              type={contextMenu.type}
              targetId={contextMenu.targetId}
              onClose={() => setContextMenu(null)}
              onDuplicate={handleDuplicateSelection}
              onDelete={() => {
                if (contextMenu.type === "node" && contextMenu.targetId) {
                  const node = nodes.find((n) => n.id === contextMenu.targetId);
                  if (node) onNodesDelete([node]);
                } else if (contextMenu.type === "edge" && contextMenu.targetId) {
                  const edge = edges.find((e) => e.id === contextMenu.targetId);
                  if (edge) onEdgesDelete([edge]);
                }
              }}
              onAddNode={() => handleAddNode("process", "New Process")}
              onAutoLayout={handleAutoLayout}
              onEditAi={() => {
                setRightOpen(true);
              }}
            />
          )}

          {/* React Flow Viewport */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onNodeDragStop={onNodeDragStop}
            onInit={setRfInstance}
            onSelectionChange={onSelectionChange}
            onNodeContextMenu={onNodeContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            snapToGrid={snapToGrid}
            snapGrid={[20, 20]}
            nodesDraggable={!isCanvasLocked}
            nodesConnectable={!isCanvasLocked}
            elementsSelectable={!isCanvasLocked}
            proOptions={{ hideAttribution: true }}
            className="flowcraft-canvas"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.5}
              color={isDarkTheme ? "#1E293B" : "#CBD5E1"}
            />
            <Controls className="bg-slate-900 border border-slate-700/80 rounded-xl fill-slate-300 p-1 shadow-xl" />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case "start":
                    return "#10B981";
                  case "end":
                    return "#F43F5E";
                  case "decision":
                    return "#F59E0B";
                  case "inputOutput":
                    return "#06B6D4";
                  case "subprocess":
                    return "#6366F1";
                  case "document":
                    return "#A855F7";
                  case "database":
                    return "#14B8A6";
                  default:
                    return "#3B82F6";
                }
              }}
              maskColor={isDarkTheme ? "rgba(11, 15, 25, 0.75)" : "rgba(241, 245, 249, 0.75)"}
              className={`border rounded-xl shadow-xl overflow-hidden ${
                isDarkTheme ? "bg-slate-950 border-slate-800" : "bg-white border-slate-300"
              }`}
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-500">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center max-w-sm pointer-events-auto">
                <p className="text-sm font-semibold text-slate-300">Canvas is empty</p>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  Start by typing a process description into Prompt AI, or add nodes using the toolbar above.
                </p>
                <button
                  onClick={() => handleAddNode("start", "Start Process")}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm"
                >
                  Add Start Node
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <RightSidebar
          selectedNode={primarySelectedNode}
          selectedEdge={primarySelectedEdge}
          selectedNodesCount={selectedNodeIds.length}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={(id) => {
            const node = nodes.find((n) => n.id === id);
            if (node) onNodesDelete([node]);
          }}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={(id) => {
            const edge = edges.find((e) => e.id === id);
            if (edge) onEdgesDelete([edge]);
          }}
          onAiModify={handleAiModify}
          isAiModifying={isAiModifying}
          diagramSummary={activeProject?.summary || ""}
          diagramAssumptions={activeProject?.assumptions || []}
          validationWarnings={validationWarnings}
          isOpen={rightOpen}
          onToggleOpen={() => setRightOpen(!rightOpen)}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Clear Diagram Canvas"
        message="Are you sure you want to clear all nodes and connections? This action can be undone with Ctrl+Z."
        confirmLabel="Clear Canvas"
        isDestructive={true}
        onConfirm={handleClearCanvas}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Export Settings Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={activeProject?.title || "Diagram"}
        hasSelection={selectedNodeIds.length > 0}
        selectedCount={selectedNodeIds.length}
        onConfirmExport={handleConfirmExport}
      />

      {/* Shortcuts Help Modal */}
      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
