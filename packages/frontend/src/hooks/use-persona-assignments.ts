import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectId, UpsertPersonaAssignmentRequest } from "@agentops/shared";
import { getPersonaAssignments, updatePersonaAssignment } from "@/mocks/api";
import { queryKeys } from "./query-keys";

export function usePersonaAssignments(projectId: ProjectId) {
  return useQuery({
    queryKey: queryKeys.personaAssignments(projectId),
    queryFn: () => getPersonaAssignments(projectId),
  });
}

export function useUpdatePersonaAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: UpsertPersonaAssignmentRequest) => updatePersonaAssignment(req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.personaAssignments(variables.projectId),
      });
    },
  });
}
