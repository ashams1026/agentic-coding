import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkflows,
  getWorkflow,
  getWorkflowStates,
  getWorkflowTransitions,
  createWorkflow,
  updateWorkflow,
  publishWorkflow,
  deleteWorkflow,
} from "@/api/client";

const queryKeys = {
  workflows: (projectId?: string) => ["workflows", projectId ?? "all"] as const,
  workflow: (id: string) => ["workflow", id] as const,
  workflowStates: (workflowId: string) => ["workflowStates", workflowId] as const,
  workflowTransitions: (workflowId: string) => ["workflowTransitions", workflowId] as const,
};

export function useWorkflows(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.workflows(projectId),
    queryFn: () => getWorkflows(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWorkflow(id: string | null) {
  return useQuery({
    queryKey: queryKeys.workflow(id ?? ""),
    queryFn: () => getWorkflow(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkflowStates(workflowId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.workflowStates(workflowId ?? ""),
    queryFn: () => getWorkflowStates(workflowId!),
    enabled: !!workflowId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkflowTransitions(workflowId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.workflowTransitions(workflowId ?? ""),
    queryFn: () => getWorkflowTransitions(workflowId!),
    enabled: !!workflowId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Parameters<typeof updateWorkflow>[1] & { id: string }) =>
      updateWorkflow(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(variables.id) });
      queryClient.invalidateQueries({ queryKey: ["workflowStates"] });
      queryClient.invalidateQueries({ queryKey: ["workflowTransitions"] });
    },
  });
}

export function usePublishWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishWorkflow,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(id) });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}
