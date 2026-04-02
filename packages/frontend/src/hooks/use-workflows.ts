import { useQuery } from "@tanstack/react-query";
import { getWorkflows, getWorkflow, getWorkflowStates, getWorkflowTransitions } from "@/api/client";

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
