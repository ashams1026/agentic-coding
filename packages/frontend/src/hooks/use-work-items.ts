import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ProjectId,
  WorkItemId,
  WorkItemEdgeId,
  WorkItem,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  CreateWorkItemEdgeRequest,
} from "@agentops/shared";
import {
  getWorkItems,
  getWorkItem,
  createWorkItem,
  updateWorkItem,
  deleteWorkItem,
  archiveWorkItem,
  unarchiveWorkItem,
  bulkArchiveWorkItems,
  bulkDeleteWorkItems,
  getWorkItemEdges,
  createWorkItemEdge,
  deleteWorkItemEdge,
} from "@/api";
import { queryKeys } from "./query-keys";

// ── Work Item queries ────────────────────────────────────────────

export function useWorkItems(parentId?: WorkItemId | null, projectId?: ProjectId, includeArchived?: boolean) {
  return useQuery({
    queryKey: queryKeys.workItems(parentId, projectId, includeArchived),
    queryFn: () => getWorkItems(parentId, projectId, includeArchived),
  });
}

export function useWorkItem(id: WorkItemId) {
  return useQuery({
    queryKey: queryKeys.workItem(id),
    queryFn: () => getWorkItem(id),
  });
}

export function useCreateWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateWorkItemRequest) => createWorkItem(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
    },
  });
}

export function useUpdateWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["workItems"],
    mutationFn: ({ id, ...req }: UpdateWorkItemRequest & { id: WorkItemId }) =>
      updateWorkItem(id, req),
    onMutate: async ({ id, ...req }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workItem(id) });
      await queryClient.cancelQueries({ queryKey: ["workItems"] });
      const previous = queryClient.getQueryData<WorkItem | null>(queryKeys.workItem(id));
      if (previous) {
        const updated: WorkItem = {
          ...previous,
          ...(req.title !== undefined && { title: req.title }),
          ...(req.description !== undefined && { description: req.description }),
          ...(req.priority !== undefined && { priority: req.priority }),
          ...(req.labels !== undefined && { labels: req.labels }),
          ...(req.currentState !== undefined && { currentState: req.currentState }),
          ...(req.context !== undefined && { context: req.context }),
          ...(req.assignedAgentId !== undefined && { assignedAgentId: req.assignedAgentId }),
        };
        queryClient.setQueryData<WorkItem | null>(queryKeys.workItem(id), updated);
        // Also optimistically update all list queries so the list row reflects changes immediately
        queryClient.setQueriesData<WorkItem[]>(
          { queryKey: ["workItems"] },
          (old) => old?.map((item) => (item.id === id ? updated : item)),
        );
      }
      return { previous };
    },
    onSuccess: (data, variables) => {
      // Set the server response directly into the cache — no refetch needed.
      // This avoids the stale-data race that invalidateQueries would cause.
      if (data) {
        queryClient.setQueryData(queryKeys.workItem(variables.id), data);
        queryClient.setQueriesData<WorkItem[]>(
          { queryKey: ["workItems"] },
          (old) => old?.map((item) => (item.id === variables.id ? data : item)),
        );
      }
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.workItem(variables.id), context.previous);
        // Revert list queries on error
        queryClient.invalidateQueries({ queryKey: ["workItems"] });
      }
    },
  });
}

export function useDeleteWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: WorkItemId) => deleteWorkItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
    },
  });
}

export function useArchiveWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cascade }: { id: WorkItemId; cascade?: boolean }) =>
      archiveWorkItem(id, cascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
    },
  });
}

export function useUnarchiveWorkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: WorkItemId) => unarchiveWorkItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
    },
  });
}

export function useBulkArchiveWorkItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, cascade }: { ids: string[]; cascade?: boolean }) =>
      bulkArchiveWorkItems(ids, cascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
    },
  });
}

export function useBulkDeleteWorkItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, cascade }: { ids: string[]; cascade?: boolean }) =>
      bulkDeleteWorkItems(ids, cascade),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
    },
  });
}

// ── Work Item Edge queries ───────────────────────────────────────

export function useWorkItemEdges(workItemId?: WorkItemId) {
  return useQuery({
    queryKey: queryKeys.workItemEdges(workItemId),
    queryFn: () => getWorkItemEdges(workItemId),
  });
}

export function useCreateWorkItemEdge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateWorkItemEdgeRequest) => createWorkItemEdge(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItemEdges"] });
    },
  });
}

export function useDeleteWorkItemEdge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: WorkItemEdgeId) => deleteWorkItemEdge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workItemEdges"] });
    },
  });
}
