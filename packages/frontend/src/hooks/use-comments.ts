import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WorkItemId, CreateCommentRequest } from "@agentops/shared";
import { getComments, getRecentComments, createComment } from "@/api";
import { queryKeys } from "./query-keys";

export function useComments(workItemId: WorkItemId) {
  return useQuery({
    queryKey: queryKeys.comments(workItemId),
    queryFn: () => getComments(workItemId),
  });
}

export function useRecentComments() {
  return useQuery({
    queryKey: queryKeys.recentComments,
    queryFn: () => getRecentComments(),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCommentRequest) => createComment(req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.workItemId) });
    },
  });
}
