import { useQuery } from "@tanstack/react-query";
import type { StoryId, TaskId, ExecutionId } from "@agentops/shared";
import { getExecutions, getExecution } from "@/mocks/api";
import { queryKeys } from "./query-keys";

export function useExecutions(targetId?: StoryId | TaskId) {
  return useQuery({
    queryKey: queryKeys.executions(targetId),
    queryFn: () => getExecutions(targetId),
  });
}

export function useExecution(id: ExecutionId) {
  return useQuery({
    queryKey: queryKeys.execution(id),
    queryFn: () => getExecution(id),
  });
}
