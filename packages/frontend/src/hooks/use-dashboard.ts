import { useQuery } from "@tanstack/react-query";
import type { ProjectId } from "@agentops/shared";
import {
  getDashboardStats,
  getCostSummary,
  getExecutionStats,
  getReadyWork,
  getProjectMemories,
} from "@/api";
import { queryKeys } from "./query-keys";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: getDashboardStats,
  });
}

export function useCostSummary() {
  return useQuery({
    queryKey: queryKeys.costSummary,
    queryFn: getCostSummary,
  });
}

export function useExecutionStats() {
  return useQuery({
    queryKey: queryKeys.executionStats,
    queryFn: getExecutionStats,
  });
}

export function useReadyWork() {
  return useQuery({
    queryKey: queryKeys.readyWork,
    queryFn: getReadyWork,
  });
}

export function useProjectMemories(projectId: ProjectId) {
  return useQuery({
    queryKey: queryKeys.projectMemories(projectId),
    queryFn: () => getProjectMemories(projectId),
  });
}
