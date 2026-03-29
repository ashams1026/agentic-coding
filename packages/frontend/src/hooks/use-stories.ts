import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ProjectId,
  StoryId,
  Story,
  CreateStoryRequest,
  UpdateStoryRequest,
} from "@agentops/shared";
import { getStories, getStory, createStory, updateStory, deleteStory } from "@/mocks/api";
import { queryKeys } from "./query-keys";

export function useStories(projectId?: ProjectId) {
  return useQuery({
    queryKey: queryKeys.stories(projectId),
    queryFn: () => getStories(projectId),
  });
}

export function useStory(id: StoryId) {
  return useQuery({
    queryKey: queryKeys.story(id),
    queryFn: () => getStory(id),
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateStoryRequest) => createStory(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateStoryRequest & { id: StoryId }) => updateStory(id, req),
    onMutate: async ({ id, ...req }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.story(id) });
      const previous = queryClient.getQueryData<Story | null>(queryKeys.story(id));
      if (previous) {
        const updated: Story = {
          ...previous,
          ...(req.title !== undefined && { title: req.title }),
          ...(req.description !== undefined && { description: req.description }),
          ...(req.priority !== undefined && { priority: req.priority }),
          ...(req.labels !== undefined && { labels: req.labels }),
          ...(req.currentState !== undefined && { currentState: req.currentState }),
          ...(req.context && {
            context: {
              acceptanceCriteria: req.context.acceptanceCriteria ?? previous.context.acceptanceCriteria,
              notes: req.context.notes ?? previous.context.notes,
            },
          }),
        };
        queryClient.setQueryData<Story | null>(queryKeys.story(id), updated);
      }
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.story(variables.id), context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.story(variables.id) });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: StoryId) => deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}
