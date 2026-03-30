import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WorkItemId } from "@agentops/shared";

export type WorkItemView = "list" | "flow";
export type GroupBy = "none" | "state" | "parent" | "priority";
export type SortBy = "priority" | "created" | "updated";

interface WorkItemsState {
  view: WorkItemView;
  groupBy: GroupBy;
  sortBy: SortBy;
  selectedItemId: WorkItemId | null;

  // Filters
  filterState: string | null;
  filterPriority: string | null;
  filterPersona: string | null;
  filterLabel: string | null;
  filterParent: WorkItemId | null;

  setView: (view: WorkItemView) => void;
  setGroupBy: (groupBy: GroupBy) => void;
  setSortBy: (sortBy: SortBy) => void;
  setSelectedItemId: (id: WorkItemId | null) => void;
  setFilterState: (state: string | null) => void;
  setFilterPriority: (priority: string | null) => void;
  setFilterPersona: (persona: string | null) => void;
  setFilterLabel: (label: string | null) => void;
  setFilterParent: (parentId: WorkItemId | null) => void;
  clearFilters: () => void;
}

export const useWorkItemsStore = create<WorkItemsState>()(
  persist(
    (set) => ({
      view: "list",
      groupBy: "state",
      sortBy: "priority",
      selectedItemId: null,

      filterState: null,
      filterPriority: null,
      filterPersona: null,
      filterLabel: null,
      filterParent: null,

      setView: (view) => set({ view }),
      setGroupBy: (groupBy) => set({ groupBy }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSelectedItemId: (id) => set({ selectedItemId: id }),
      setFilterState: (filterState) => set({ filterState }),
      setFilterPriority: (filterPriority) => set({ filterPriority }),
      setFilterPersona: (filterPersona) => set({ filterPersona }),
      setFilterLabel: (filterLabel) => set({ filterLabel }),
      setFilterParent: (filterParent) => set({ filterParent }),
      clearFilters: () =>
        set({
          filterState: null,
          filterPriority: null,
          filterPersona: null,
          filterLabel: null,
          filterParent: null,
        }),
    }),
    {
      name: "agentops-work-items",
      partialize: (state) => ({
        view: state.view,
        groupBy: state.groupBy,
        sortBy: state.sortBy,
      }),
    },
  ),
);
