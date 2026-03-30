import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WorkItemId, ProposalId, UpdateProposalRequest } from "@agentops/shared";
import { getProposals, getProposal, updateProposal } from "@/api";
import { queryKeys } from "./query-keys";

export function useProposals(workItemId?: WorkItemId) {
  return useQuery({
    queryKey: queryKeys.proposals(workItemId),
    queryFn: () => getProposals(workItemId),
  });
}

export function useProposal(id: ProposalId) {
  return useQuery({
    queryKey: queryKeys.proposal(id),
    queryFn: () => getProposal(id),
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateProposalRequest & { id: ProposalId }) =>
      updateProposal(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });
}
