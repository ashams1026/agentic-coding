import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  WorkflowId,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
} from "@agentops/shared";
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getTriggers,
} from "@/mocks/api";
import { queryKeys } from "./query-keys";

export function useWorkflows() {
  return useQuery({
    queryKey: queryKeys.workflows,
    queryFn: getWorkflows,
  });
}

export function useWorkflow(id: WorkflowId) {
  return useQuery({
    queryKey: queryKeys.workflow(id),
    queryFn: () => getWorkflow(id),
  });
}

export function useCreateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateWorkflowRequest) => createWorkflow(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
    },
  });
}

export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateWorkflowRequest & { id: WorkflowId }) =>
      updateWorkflow(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow(variables.id) });
    },
  });
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: WorkflowId) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows });
    },
  });
}

export function useTriggers(workflowId?: WorkflowId) {
  return useQuery({
    queryKey: queryKeys.triggers(workflowId),
    queryFn: () => getTriggers(workflowId),
  });
}
