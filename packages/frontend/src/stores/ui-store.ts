import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";
export type ApiMode = "mock" | "api";
export type Density = "comfortable" | "compact";

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  selectedProjectId: string | null;
  theme: Theme;
  apiMode: ApiMode;
  density: Density;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setSelectedProjectId: (id: string | null) => void;
  setTheme: (theme: Theme) => void;
  setApiMode: (mode: ApiMode) => void;
  setDensity: (density: Density) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      selectedProjectId: null,
      theme: "system",
      apiMode: "mock",
      density: "comfortable",

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
      setTheme: (theme) => set({ theme }),
      setApiMode: (mode) => set({ apiMode: mode }),
      setDensity: (density) => set({ density }),
    }),
    {
      name: "agentops-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        selectedProjectId: state.selectedProjectId,
        theme: state.theme,
        apiMode: state.apiMode,
        density: state.density,
      }),
    },
  ),
);
