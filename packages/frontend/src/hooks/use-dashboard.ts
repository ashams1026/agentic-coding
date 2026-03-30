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

export function useDashboardStats(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.dashboardStats(projectId),
    queryFn: () => getDashboardStats(projectId),
  });
}

export function useCostSummary(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.costSummary(projectId),
    queryFn: () => getCostSummary(projectId),
  });
}

export function useExecutionStats(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.executionStats(projectId),
    queryFn: () => getExecutionStats(projectId),
  });
}

export function useReadyWork(projectId?: string) {
  return useQuery({
    queryKey: queryKeys.readyWork(projectId),
    queryFn: () => getReadyWork(projectId),
  });
}

export function useProjectMemories(projectId: ProjectId) {
  return useQuery({
    queryKey: queryKeys.projectMemories(projectId),
    queryFn: () => getProjectMemories(projectId),
  });
}
