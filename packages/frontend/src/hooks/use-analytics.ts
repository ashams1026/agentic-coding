import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsCostByAgent,
  getAnalyticsCostByModel,
  getAnalyticsTokensOverTime,
  getAnalyticsTopExecutions,
} from "@/api/client";

export function useAnalyticsCostByAgent(projectId?: string, range?: string) {
  return useQuery({
    queryKey: ["analytics", "cost-by-agent", projectId ?? "all", range ?? "30d"],
    queryFn: () => getAnalyticsCostByAgent({ projectId, range }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAnalyticsCostByModel(projectId?: string, range?: string) {
  return useQuery({
    queryKey: ["analytics", "cost-by-model", projectId ?? "all", range ?? "30d"],
    queryFn: () => getAnalyticsCostByModel({ projectId, range }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAnalyticsTokensOverTime(projectId?: string, range?: string) {
  return useQuery({
    queryKey: ["analytics", "tokens-over-time", projectId ?? "all", range ?? "7d"],
    queryFn: () => getAnalyticsTokensOverTime({ projectId, range }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAnalyticsTopExecutions(projectId?: string, limit?: number) {
  return useQuery({
    queryKey: ["analytics", "top-executions", projectId ?? "all", limit ?? 10],
    queryFn: () => getAnalyticsTopExecutions({ projectId, limit }),
    staleTime: 2 * 60 * 1000,
  });
}
