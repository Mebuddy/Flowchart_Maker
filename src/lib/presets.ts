import { DiagramPreset, NodeStyle } from "./schema";

export interface PresetColors {
  name: string;
  description: string;
  canvasBg: { dark: string; light: string };
  defaultNode: {
    bg: string;
    border: string;
    text: string;
  };
  types: Record<string, { bg: string; border: string; text: string; badge?: string }>;
  edge: { stroke: string; labelBg: string; labelText: string };
}

export const DIAGRAM_PRESETS: Record<DiagramPreset, PresetColors> = {
  default: {
    name: "Default Tech",
    description: "Flowcraft signature high-contrast cyberpunk dark / clean light",
    canvasBg: { dark: "#0B0F19", light: "#F8FAFC" },
    defaultNode: { bg: "#0F172A", border: "#334155", text: "#F8FAFC" },
    types: {
      start: { bg: "#064E3B", border: "#10B981", text: "#ECFDF5", badge: "#34D399" },
      end: { bg: "#881337", border: "#F43F5E", text: "#FFF1F2", badge: "#FB7185" },
      process: { bg: "#0F172A", border: "#3B82F6", text: "#F8FAFC", badge: "#60A5FA" },
      decision: { bg: "#1E1B4B", border: "#F59E0B", text: "#FEF3C7", badge: "#FBBF24" },
      inputOutput: { bg: "#083344", border: "#06B6D4", text: "#ECFEFF", badge: "#22D3EE" },
      subprocess: { bg: "#312E81", border: "#6366F1", text: "#EEF2FF", badge: "#818CF8" },
      document: { bg: "#3B0764", border: "#A855F7", text: "#FAF5FF", badge: "#C084FC" },
      database: { bg: "#134E4A", border: "#14B8A6", text: "#F0FDFA", badge: "#2DD4BF" },
    },
    edge: { stroke: "#64748B", labelBg: "#0F172A", labelText: "#E2E8F0" },
  },
  "minimal-light": {
    name: "Minimal Light",
    description: "Clean paper aesthetic with subtle borders and ink-dark text",
    canvasBg: { dark: "#18181B", light: "#FFFFFF" },
    defaultNode: { bg: "#FFFFFF", border: "#E2E8F0", text: "#0F172A" },
    types: {
      start: { bg: "#ECFDF5", border: "#059669", text: "#065F46", badge: "#059669" },
      end: { bg: "#FFF1F2", border: "#E11D48", text: "#9F1239", badge: "#E11D48" },
      process: { bg: "#F8FAFC", border: "#94A3B8", text: "#0F172A", badge: "#475569" },
      decision: { bg: "#FFFBEB", border: "#D97706", text: "#92400E", badge: "#D97706" },
      inputOutput: { bg: "#F0FDFA", border: "#0D9488", text: "#115E59", badge: "#0D9488" },
      subprocess: { bg: "#EEF2FF", border: "#4F46E5", text: "#3730A3", badge: "#4F46E5" },
      document: { bg: "#FAF5FF", border: "#9333EA", text: "#6B21A8", badge: "#9333EA" },
      database: { bg: "#ECFEFF", border: "#0891B2", text: "#155E75", badge: "#0891B2" },
    },
    edge: { stroke: "#94A3B8", labelBg: "#F1F5F9", labelText: "#334155" },
  },
  "dark-technical": {
    name: "Dark Technical",
    description: "Terminal blueprint with cyan glowing borders and monospace notes",
    canvasBg: { dark: "#050811", light: "#0B132B" },
    defaultNode: { bg: "#0B1528", border: "#1E3A8A", text: "#E0F2FE" },
    types: {
      start: { bg: "#062822", border: "#14B8A6", text: "#CCFBF1", badge: "#2DD4BF" },
      end: { bg: "#350C19", border: "#E11D48", text: "#FFE4E6", badge: "#FB7185" },
      process: { bg: "#0B1528", border: "#38BDF8", text: "#F0F9FF", badge: "#38BDF8" },
      decision: { bg: "#231B0B", border: "#FBBF24", text: "#FEF3C7", badge: "#FBBF24" },
      inputOutput: { bg: "#0C2333", border: "#00F5D4", text: "#E0FCF8", badge: "#00F5D4" },
      subprocess: { bg: "#151538", border: "#818CF8", text: "#EEF2FF", badge: "#818CF8" },
      document: { bg: "#250F38", border: "#C084FC", text: "#FAF5FF", badge: "#C084FC" },
      database: { bg: "#092527", border: "#2DD4BF", text: "#CCFBF1", badge: "#2DD4BF" },
    },
    edge: { stroke: "#38BDF8", labelBg: "#050811", labelText: "#7DD3FC" },
  },
  presentation: {
    name: "Presentation",
    description: "Vibrant and punchy with bold colors for slide decks and demos",
    canvasBg: { dark: "#0F172A", light: "#F1F5F9" },
    defaultNode: { bg: "#1E293B", border: "#6366F1", text: "#FFFFFF" },
    types: {
      start: { bg: "#047857", border: "#34D399", text: "#FFFFFF", badge: "#A7F3D0" },
      end: { bg: "#BE123C", border: "#FB7185", text: "#FFFFFF", badge: "#FECDD3" },
      process: { bg: "#1D4ED8", border: "#60A5FA", text: "#FFFFFF", badge: "#BFDBFE" },
      decision: { bg: "#B45309", border: "#FBBF24", text: "#FFFFFF", badge: "#FDE68A" },
      inputOutput: { bg: "#0E7490", border: "#22D3EE", text: "#FFFFFF", badge: "#A5F3FC" },
      subprocess: { bg: "#4338CA", border: "#818CF8", text: "#FFFFFF", badge: "#C7D2FE" },
      document: { bg: "#7E22CE", border: "#C084FC", text: "#FFFFFF", badge: "#E9D5FF" },
      database: { bg: "#0F766E", border: "#2DD4BF", text: "#FFFFFF", badge: "#99F6E4" },
    },
    edge: { stroke: "#818CF8", labelBg: "#1E293B", labelText: "#E0E7FF" },
  },
  monochrome: {
    name: "Monochrome",
    description: "Architectural blueprint with pure shades of black, grey, and white",
    canvasBg: { dark: "#121212", light: "#FAFAFA" },
    defaultNode: { bg: "#1E1E1E", border: "#525252", text: "#F5F5F5" },
    types: {
      start: { bg: "#262626", border: "#737373", text: "#FAFAFA", badge: "#A3A3A3" },
      end: { bg: "#171717", border: "#525252", text: "#FAFAFA", badge: "#A3A3A3" },
      process: { bg: "#262626", border: "#737373", text: "#FAFAFA", badge: "#D4D4D4" },
      decision: { bg: "#1F1F1F", border: "#A3A3A3", text: "#FFFFFF", badge: "#E5E5E5" },
      inputOutput: { bg: "#262626", border: "#737373", text: "#FAFAFA", badge: "#D4D4D4" },
      subprocess: { bg: "#1F1F1F", border: "#737373", text: "#FAFAFA", badge: "#D4D4D4" },
      document: { bg: "#262626", border: "#737373", text: "#FAFAFA", badge: "#D4D4D4" },
      database: { bg: "#1F1F1F", border: "#737373", text: "#FAFAFA", badge: "#D4D4D4" },
    },
    edge: { stroke: "#737373", labelBg: "#171717", labelText: "#D4D4D4" },
  },
  "soft-professional": {
    name: "Soft Professional",
    description: "Curated modern corporate palette with indigo and sage accents",
    canvasBg: { dark: "#0F141C", light: "#F8FAFC" },
    defaultNode: { bg: "#1A2230", border: "#334155", text: "#F1F5F9" },
    types: {
      start: { bg: "#132D29", border: "#34D399", text: "#ECFDF5", badge: "#6EE7B7" },
      end: { bg: "#371C25", border: "#F43F5E", text: "#FFF1F2", badge: "#FDA4AF" },
      process: { bg: "#1A263D", border: "#60A5FA", text: "#EFF6FF", badge: "#93C5FD" },
      decision: { bg: "#30261A", border: "#FBBF24", text: "#FFFBEB", badge: "#FDE68A" },
      inputOutput: { bg: "#142F38", border: "#38BDF8", text: "#F0F9FF", badge: "#7DD3FC" },
      subprocess: { bg: "#24203D", border: "#A78BFA", text: "#F5F3FF", badge: "#C4B5FD" },
      document: { bg: "#2D1D38", border: "#E879F9", text: "#FDF4FF", badge: "#F0ABFC" },
      database: { bg: "#133130", border: "#2DD4BF", text: "#F0FDFA", badge: "#5EEAD4" },
    },
    edge: { stroke: "#64748B", labelBg: "#1A2230", labelText: "#CBD5E1" },
  },
};
