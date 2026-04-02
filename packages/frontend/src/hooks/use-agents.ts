import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AgentId, CreateAgentRequest, UpdateAgentRequest } from "@agentops/shared";
import {
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
} from "@/api";
import { queryKeys } from "./query-keys";

export function useAgents() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: getAgents,
  });
}

export function useAgent(id: AgentId) {
  return useQuery({
    queryKey: queryKeys.agent(id),
    queryFn: () => getAgent(id),
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateAgentRequest) => createAgent(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateAgentRequest & { id: AgentId }) =>
      updateAgent(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      queryClient.invalidateQueries({ queryKey: queryKeys.agent(variables.id) });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: AgentId) => deleteAgent(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.agent(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}
