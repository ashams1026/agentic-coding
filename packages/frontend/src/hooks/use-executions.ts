import { useQuery } from "@tanstack/react-query";
import type { WorkItemId, ExecutionId } from "@agentops/shared";
import { getExecutions, getExecution } from "@/api";
import { queryKeys } from "./query-keys";

export function useExecutions(workItemId?: WorkItemId, projectId?: string) {
  return useQuery({
    queryKey: queryKeys.executions(workItemId, projectId),
    queryFn: () => getExecutions(workItemId, projectId),
  });
}

export function useExecution(id: ExecutionId) {
  return useQuery({
    queryKey: queryKeys.execution(id),
    queryFn: () => getExecution(id),
  });
}
