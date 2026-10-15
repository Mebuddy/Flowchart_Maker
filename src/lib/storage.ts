import { FlowProject, FlowProjectSchema } from "./schema";

const STORAGE_KEY = "flowcraft_projects_v1";
const ACTIVE_ID_KEY = "flowcraft_active_project_id";

export const SAMPLE_PROJECTS: FlowProject[] = [
  {
    version: 1,
    id: "sample-temp-controller",
    title: "Temperature Sensor Control Loop",
    summary: "Continuous monitoring loop that samples temperature every second and triggers cooling fan when exceeding 40°C.",
    assumptions: ["Assumes hardware clock provides 1Hz polling interval", "Continuous controller with no explicit termination"],
    originalPrompt: "Read the temperature sensor every second. If the temperature exceeds 40 degrees Celsius, turn on the cooling fan. Otherwise, keep the fan off. Repeat this process continuously.",
    layoutDirection: "TB",
    preset: "default",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [
      {
        id: "start_node",
        type: "start",
        label: "System Startup",
        description: "Initialize controller and timer interrupt",
        position: { x: 250, y: 30 },
      },
      {
        id: "read_sensor",
        type: "inputOutput",
        label: "Read Temp Sensor",
        description: "Sample analog temperature sensor pin",
        position: { x: 240, y: 130 },
      },
      {
        id: "check_temp",
        type: "decision",
        label: "Temp > 40°C?",
        description: "Evaluate if current temperature exceeds safety threshold",
        position: { x: 230, y: 240 },
      },
      {
        id: "fan_on",
        type: "process",
        label: "Turn On Fan",
        description: "Drive cooling fan relay HIGH",
        position: { x: 120, y: 380 },
      },
      {
        id: "fan_off",
        type: "process",
        label: "Keep Fan Off",
        description: "Drive cooling fan relay LOW",
        position: { x: 380, y: 380 },
      },
      {
        id: "delay_node",
        type: "process",
        label: "Wait 1 Second",
        description: "Sleep until next periodic tick",
        position: { x: 250, y: 500 },
      },
    ],
    edges: [
      { id: "e1", source: "start_node", target: "read_sensor" },
      { id: "e2", source: "read_sensor", target: "check_temp" },
      { id: "e3", source: "check_temp", target: "fan_on", label: "Yes" },
      { id: "e4", source: "check_temp", target: "fan_off", label: "No" },
      { id: "e5", source: "fan_on", target: "delay_node" },
      { id: "e6", source: "fan_off", target: "delay_node" },
      { id: "e7", source: "delay_node", target: "read_sensor", label: "Repeat" },
    ],
  },
];

export function getStoredProjects(): FlowProject[] {
  if (typeof window === "undefined") return SAMPLE_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PROJECTS));
      return SAMPLE_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SAMPLE_PROJECTS;

    const validated: FlowProject[] = [];
    for (const item of parsed) {
      const res = FlowProjectSchema.safeParse(item);
      if (res.success) {
        validated.push(res.data);
      }
    }
    return validated.length > 0 ? validated : SAMPLE_PROJECTS;
  } catch {
    return SAMPLE_PROJECTS;
  }
}

export function saveProject(project: FlowProject): void {
  if (typeof window === "undefined") return;
  const current = getStoredProjects();
  const index = current.findIndex((p) => p.id === project.id);
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  let nextProjects: FlowProject[];
  if (index >= 0) {
    nextProjects = [...current];
    nextProjects[index] = updatedProject;
  } else {
    nextProjects = [updatedProject, ...current];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));
  localStorage.setItem(ACTIVE_ID_KEY, updatedProject.id);
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ID_KEY);
}

export function setActiveProjectId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ID_KEY, id);
}

export function deleteProject(id: string): FlowProject[] {
  if (typeof window === "undefined") return [];
  const current = getStoredProjects();
  const next = current.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  if (getActiveProjectId() === id) {
    if (next.length > 0) {
      setActiveProjectId(next[0].id);
    } else {
      localStorage.removeItem(ACTIVE_ID_KEY);
    }
  }
  return next;
}

export function duplicateProject(id: string): FlowProject | null {
  const current = getStoredProjects();
  const target = current.find((p) => p.id === id);
  if (!target) return null;

  const duplicated: FlowProject = {
    ...target,
    id: `project_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: `${target.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProject(duplicated);
  return duplicated;
}
