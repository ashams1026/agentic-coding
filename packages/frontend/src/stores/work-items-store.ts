import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkItemId } from "@agentops/shared";

export type WorkItemView = "list";
export type GroupBy = "none" | "state" | "parent" | "priority";
export type SortBy = "priority" | "created" | "updated";
export type SortDir = "asc" | "desc";

interface WorkItemsState {
  view: WorkItemView;
  groupBy: GroupBy;
  sortBy: SortBy;
  sortDir: SortDir;
  selectedItemId: WorkItemId | null;
  detailPanelWidth: number; // percentage (30-70)

  // Filters
  searchQuery: string;
  filterState: string | null;
  filterPriority: string | null;
  filterAgents: string[];
  filterLabels: string[];
  filterParent: WorkItemId | null;
  showArchived: boolean;
  selectedIds: string[];

  setView: (view: WorkItemView) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSortDir: (sortDir: SortDir) => void;
  toggleSortDir: () => void;
  setSelectedItemId: (id: WorkItemId | null) => void;
  setDetailPanelWidth: (width: number) => void;
  setSearchQuery: (query: string) => void;
  setFilterState: (state: string | null) => void;
  setFilterPriority: (priority: string | null) => void;
  toggleFilterAgent: (agentId: string) => void;
  toggleFilterLabel: (label: string) => void;
  setFilterParent: (parentId: WorkItemId | null) => void;
  setShowArchived: (show: boolean) => void;
  toggleSelectId: (id: string) => void;
  clearSelection: () => void;
  clearFilters: () => void;
}

export const useWorkItemsStore = create<WorkItemsState>()(
  persist(
    (set) => ({
      view: "list",
      groupBy: "state",
      sortBy: "priority",
      sortDir: "asc",
      selectedItemId: null,
      detailPanelWidth: 60,

      searchQuery: "",
      filterState: null,
      filterPriority: null,
      filterAgents: [],
      filterLabels: [],
      filterParent: null,
      showArchived: false,
      selectedIds: [],

      setView: (view) => set({ view }),
      setGroupBy: (groupBy) => set({ groupBy }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortDir: (sortDir) => set({ sortDir }),
      toggleSortDir: () =>
        set((state) => ({ sortDir: state.sortDir === "asc" ? "desc" : "asc" })),
      setSelectedItemId: (id) => set({ selectedItemId: id }),
      setDetailPanelWidth: (width) =>
        set({ detailPanelWidth: Math.min(70, Math.max(30, width)) }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFilterState: (filterState) => set({ filterState }),
      setFilterPriority: (filterPriority) => set({ filterPriority }),
      toggleFilterAgent: (agentId) =>
        set((state) => ({
          filterAgents: state.filterAgents.includes(agentId)
            ? state.filterAgents.filter((id) => id !== agentId)
            : [...state.filterAgents, agentId],
        })),
      toggleFilterLabel: (label) =>
        set((state) => ({
          filterLabels: state.filterLabels.includes(label)
            ? state.filterLabels.filter((l) => l !== label)
            : [...state.filterLabels, label],
        })),
      setFilterParent: (filterParent) => set({ filterParent }),
      setShowArchived: (showArchived) => set({ showArchived }),
      toggleSelectId: (id) =>
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((s) => s !== id)
            : [...state.selectedIds, id],
        })),
      clearSelection: () => set({ selectedIds: [] }),
      clearFilters: () =>
        set({
          searchQuery: "",
          filterState: null,
          filterPriority: null,
          filterAgents: [],
          filterLabels: [],
          filterParent: null,
          showArchived: false,
        }),
    }),
    {
      name: "agentops-work-items",
      partialize: (state) => ({
        view: state.view,
        groupBy: state.groupBy,
        sortBy: state.sortBy,
        sortDir: state.sortDir,
        detailPanelWidth: state.detailPanelWidth,
      }),
    },
  ),
);
