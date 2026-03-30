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
  getWorkItemEdges,
  createWorkItemEdge,
  deleteWorkItemEdge,
} from "@/mocks/api";
import { queryKeys } from "./query-keys";

// ── Work Item queries ────────────────────────────────────────────

export function useWorkItems(parentId?: WorkItemId | null, projectId?: ProjectId) {
  return useQuery({
    queryKey: queryKeys.workItems(parentId, projectId),
    queryFn: () => getWorkItems(parentId, projectId),
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
    mutationFn: ({ id, ...req }: UpdateWorkItemRequest & { id: WorkItemId }) =>
      updateWorkItem(id, req),
    onMutate: async ({ id, ...req }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.workItem(id) });
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
          ...(req.assignedPersonaId !== undefined && { assignedPersonaId: req.assignedPersonaId }),
        };
        queryClient.setQueryData<WorkItem | null>(queryKeys.workItem(id), updated);
      }
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.workItem(variables.id), context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workItems"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workItem(variables.id) });
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
