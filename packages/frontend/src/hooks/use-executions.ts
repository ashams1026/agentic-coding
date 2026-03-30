import { useQuery } from "@tanstack/react-query";
import type { WorkItemId, ExecutionId } from "@agentops/shared";
import { getExecutions, getExecution } from "@/api";
import { queryKeys } from "./query-keys";

export function useExecutions(workItemId?: WorkItemId) {
  return useQuery({
    queryKey: queryKeys.executions(workItemId),
    queryFn: () => getExecutions(workItemId),
  });
}

export function useExecution(id: ExecutionId) {
  return useQuery({
    queryKey: queryKeys.execution(id),
    queryFn: () => getExecution(id),
  });
}
