"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes, CustomNodeData } from "@/components/nodes/FlowNodes";
import { edgeTypes } from "@/components/nodes/FlowEdges";
import { Header } from "./Header";
import { LeftSidebar } from "./LeftSidebar";
import { RightSidebar } from "./RightSidebar";
import { Toolbar } from "./Toolbar";
import { ConfirmationModal } from "./ConfirmationModal";

import {
  FlowProject,
  LayoutDirection,
  NodeType,
  FlowNode,
  FlowEdge,
} from "@/lib/schema";
import { calculateAutoLayout, PositionedNode } from "@/lib/layout";
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

  // 2. React Flow State
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
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<ValidationIssue[]>([]);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // 4. Selection State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // 5. Undo/Redo State
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Helper to push snapshot
  const pushHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, { nodes: newNodes, edges: newEdges }].slice(-30); // max 30 snapshots
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const activeProjectRef = useRef<FlowProject | null>(activeProject);
  useEffect(() => {
    activeProjectRef.current = activeProject;
  }, [activeProject]);

  const loadProjectIntoEditor = useCallback((project: FlowProject) => {
    setActiveProject(project);
    setActiveProjectId(project.id);
    setPrompt(project.originalPrompt || "");

    const rfNodes: Node[] = project.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        label: n.label,
        type: n.type,
        description: n.description,
      },
    }));

    const rfEdges: Edge[] = project.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      type: "custom",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: "#64748B",
      },
    }));

    setNodes(rfNodes);
    setEdges(rfEdges);

    // Initial validation
    const vResult = validateGraphSemantics({
      title: project.title,
      summary: project.summary,
      assumptions: project.assumptions,
      nodes: project.nodes,
      edges: project.edges,
    });
    setValidationWarnings(vResult.warnings);

    // Reset history
    setHistory([{ nodes: rfNodes, edges: rfEdges }]);
    setHistoryIndex(0);
    setSaveStatus("saved");

    // Center viewport
    setTimeout(() => {
      rfInstance?.fitView({ padding: 0.2 });
    }, 100);
  }, [rfInstance, setEdges, setNodes]);

  // Load projects on initial mount
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    setProjects(loadedProjects);

    const activeId = getActiveProjectId();
    const current = loadedProjects.find((p) => p.id === activeId) || loadedProjects[0] || SAMPLE_PROJECTS[0];
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
        position: n.position,
      }));

      const updatedEdges = edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: (e.label as string) || undefined,
      }));

      const updatedProject: FlowProject = {
        ...currentActive,
        originalPrompt: prompt,
        nodes: updatedNodes,
        edges: updatedEdges,
        updatedAt: new Date().toISOString(),
      };

      saveProject(updatedProject);
      setActiveProject(updatedProject);
      setProjects(getStoredProjects());
      setSaveStatus("saved");

      // Validate
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
  }, [nodes, edges, prompt]);

  // Connect new edge
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
        id: `e_${params.source}_${params.target}_${Date.now()}`,
        source: params.source,
        target: params.target,
        type: "custom",
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

  // Keyboard Shortcuts for Undo/Redo & Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Automatic Layout
  const handleAutoLayout = useCallback(async () => {
    if (!activeProject || nodes.length === 0) return;

    const flowNodes: FlowNode[] = nodes.map((n) => ({
      id: n.id,
      type: ((n.data as unknown as CustomNodeData)?.type || n.type || "process") as NodeType,
      label: (n.data as unknown as CustomNodeData)?.label || "Node",
      description: (n.data as unknown as CustomNodeData)?.description,
    }));

    const flowEdges: FlowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: (e.label as string) || undefined,
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
        },
      };
    });

    setNodes(layoutedRfNodes);
    pushHistory(layoutedRfNodes, edges);

    setTimeout(() => {
      rfInstance?.fitView({ padding: 0.2, duration: 400 });
    }, 50);
  }, [activeProject, nodes, edges, rfInstance, setNodes, pushHistory]);

  // Toggle layout direction (TB <-> LR)
  const handleToggleLayoutDirection = () => {
    if (!activeProject) return;
    const nextDir: LayoutDirection = activeProject.layoutDirection === "TB" ? "LR" : "TB";
    setActiveProject((prev) => (prev ? { ...prev, layoutDirection: nextDir } : null));
    setTimeout(() => {
      handleAutoLayout();
    }, 50);
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
      },
    };

    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    pushHistory(nextNodes, edges);
  };

  // Node & Edge Inspector Updates
  const handleUpdateNode = (
    id: string,
    updates: { label?: string; type?: NodeType; description?: string }
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
            },
          };
        }
        return n;
      });
      pushHistory(next, edges);
      return next;
    });
  };

  const handleDeleteNode = (id: string) => {
    const nextNodes = nodes.filter((n) => n.id !== id);
    const nextEdges = edges.filter((e) => e.source !== id && e.target !== id);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setSelectedNodeId(null);
    pushHistory(nextNodes, nextEdges);
  };

  const handleUpdateEdge = (id: string, updates: { label?: string }) => {
    setEdges((eds) => {
      const next = eds.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            label: updates.label !== undefined ? updates.label : e.label,
          };
        }
        return e;
      });
      pushHistory(nodes, next);
      return next;
    });
  };

  const handleDeleteEdge = (id: string) => {
    const nextEdges = edges.filter((e) => e.id !== id);
    setEdges(nextEdges);
    setSelectedEdgeId(null);
    pushHistory(nodes, nextEdges);
  };

  // Selection handlers
  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      if (selNodes.length > 0) {
        setSelectedNodeId(selNodes[0].id);
        setSelectedEdgeId(null);
      } else if (selEdges.length > 0) {
        setSelectedEdgeId(selEdges[0].id);
        setSelectedNodeId(null);
      } else {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
    },
    []
  );

  // Clear Canvas
  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsClearModalOpen(false);
    pushHistory([], []);
  };

  // AI Flowchart Generation
  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
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

      const generatedGraph = data.graph;
      const layoutResult = await calculateAutoLayout(
        generatedGraph.nodes,
        generatedGraph.edges,
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
        },
      }));

      const rfEdges: Edge[] = layoutResult.edges.map((e: FlowEdge) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "custom",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: "#64748B",
        },
      }));

      // Update active diagram without destroying prompt
      const updatedProject: FlowProject = {
        version: 1,
        id: activeProject?.id || `project_${Date.now()}`,
        title: generatedGraph.title || "Generated Diagram",
        summary: generatedGraph.summary || "",
        assumptions: generatedGraph.assumptions || [],
        originalPrompt: prompt,
        layoutDirection: activeProject?.layoutDirection || "TB",
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
    }
  };

  // Diagram Manager Actions
  const handleNewDiagram = () => {
    const newProj: FlowProject = {
      version: 1,
      id: `project_${Date.now()}`,
      title: "Untitled Diagram",
      summary: "Manually created flowchart.",
      assumptions: [],
      originalPrompt: "",
      layoutDirection: "TB",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: "start_node",
          type: "start",
          label: "Start",
          position: { x: 250, y: 100 },
        },
      ],
      edges: [],
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

  // Import JSON project
  const handleImportJson = async (file: File) => {
    const text = await file.text();
    const result = parseAndValidateImport(text);
    if (!result.success || !result.project) {
      alert(result.error || "Failed to validate imported project file.");
      return;
    }
    const importedProject = {
      ...result.project,
      id: `imported_${Date.now()}`,
    };
    saveProject(importedProject);
    setProjects(getStoredProjects());
    loadProjectIntoEditor(importedProject);
  };

  // Export handlers
  const handleExportPng = () => {
    if (flowContainerRef.current && activeProject) {
      exportCanvasToImage(flowContainerRef.current, "png", activeProject.title);
    }
  };

  const handleExportSvg = () => {
    if (flowContainerRef.current && activeProject) {
      exportCanvasToImage(flowContainerRef.current, "svg", activeProject.title);
    }
  };

  const handleExportJson = () => {
    if (activeProject) {
      exportProjectToJson(activeProject);
    }
  };

  const handleExportMermaid = () => {
    if (activeProject) {
      exportProjectToMermaid(activeProject);
    }
  };

  // Selected item references for Inspector
  const selectedNodeObj = nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeData = selectedNodeObj
    ? {
        id: selectedNodeObj.id,
        type: ((selectedNodeObj.data as unknown as CustomNodeData)?.type ||
          selectedNodeObj.type ||
          "process") as NodeType,
        label: (selectedNodeObj.data as unknown as CustomNodeData)?.label || "",
        description: (selectedNodeObj.data as unknown as CustomNodeData)?.description,
      }
    : null;

  const selectedEdgeObj = edges.find((e) => e.id === selectedEdgeId);
  const selectedEdgeData = selectedEdgeObj
    ? {
        id: selectedEdgeObj.id,
        source: selectedEdgeObj.source,
        target: selectedEdgeObj.target,
        label: (selectedEdgeObj.label as string) || "",
      }
    : null;

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden ${
        isDarkTheme ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Application Header */}
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
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onExportJson={handleExportJson}
        onExportMermaid={handleExportMermaid}
        isDarkTheme={isDarkTheme}
        onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
        authRequired={authRequired}
        onLogout={onLogout}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Prompt & Saved */}
        <LeftSidebar
          prompt={prompt}
          onPromptChange={setPrompt}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
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
          onNewDiagram={handleNewDiagram}
          isOpen={leftOpen}
          onToggleOpen={() => setLeftOpen(!leftOpen)}
        />

        {/* Center Canvas */}
        <div ref={flowContainerRef} className="flex-1 h-full relative overflow-hidden bg-[#0B0F19]">
          <Toolbar onAddNode={handleAddNode} />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2.5}
            proOptions={{ hideAttribution: true }}
            className="flowcraft-canvas"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1.5}
              color="#1E293B"
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
              maskColor="rgba(11, 15, 25, 0.75)"
              className="bg-slate-950 border border-slate-800 rounded-xl shadow-xl overflow-hidden"
            />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-500">
              <p className="text-sm font-semibold text-slate-400">Canvas is empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                Use the Prompt AI panel to generate a flowchart or add nodes from the top toolbar.
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: Inspector & Diagram Analysis */}
        <RightSidebar
          selectedNode={selectedNodeData}
          selectedEdge={selectedEdgeData}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteEdge={handleDeleteEdge}
          diagramSummary={activeProject?.summary || ""}
          diagramAssumptions={activeProject?.assumptions || []}
          validationWarnings={validationWarnings}
          isOpen={rightOpen}
          onToggleOpen={() => setRightOpen(!rightOpen)}
        />
      </div>

      {/* Clear Canvas Confirmation */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        title="Clear Diagram"
        message="Are you sure you want to remove all nodes and connections from this diagram? You can undo this action with Ctrl+Z."
        confirmLabel="Clear Canvas"
        cancelLabel="Keep Diagram"
        isDestructive={true}
        onConfirm={handleClearCanvas}
        onCancel={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};
