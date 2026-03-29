import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { StoryId, TaskId, CreateCommentRequest } from "@agentops/shared";
import { getComments, createComment } from "@/mocks/api";
import { queryKeys } from "./query-keys";

export function useComments(targetId: StoryId | TaskId) {
  return useQuery({
    queryKey: queryKeys.comments(targetId),
    queryFn: () => getComments(targetId),
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCommentRequest) => createComment(req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(variables.targetId) });
    },
  });
}
