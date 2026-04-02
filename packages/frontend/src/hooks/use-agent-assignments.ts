import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectId, UpsertAgentAssignmentRequest } from "@agentops/shared";
import { getAgentAssignments, updateAgentAssignment } from "@/api";
import { queryKeys } from "./query-keys";

export function useAgentAssignments(projectId: ProjectId | null) {
  return useQuery({
    queryKey: queryKeys.agentAssignments(projectId!),
    queryFn: () => getAgentAssignments(projectId!),
    enabled: !!projectId,
  });
}

export function useUpdateAgentAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: UpsertAgentAssignmentRequest) => updateAgentAssignment(req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.agentAssignments(variables.projectId),
      });
    },
  });
}
