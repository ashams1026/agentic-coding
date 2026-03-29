import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  StoryId,
  TaskId,
  TaskEdgeId,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateTaskEdgeRequest,
} from "@agentops/shared";
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getTaskEdges,
  createTaskEdge,
  deleteTaskEdge,
} from "@/mocks/api";
import { queryKeys } from "./query-keys";

// ── Task queries ──────────────────────────────────────────────────

export function useTasks(storyId?: StoryId) {
  return useQuery({
    queryKey: queryKeys.tasks(storyId),
    queryFn: () => getTasks(storyId),
  });
}

export function useTask(id: TaskId) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => getTask(id),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateTaskRequest) => createTask(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateTaskRequest & { id: TaskId }) => updateTask(id, req),
    onMutate: async ({ id, ...req }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });
      const previous = queryClient.getQueryData<Task | null>(queryKeys.task(id));
      if (previous) {
        const updated: Task = {
          ...previous,
          ...(req.title !== undefined && { title: req.title }),
          ...(req.description !== undefined && { description: req.description }),
          ...(req.currentState !== undefined && { currentState: req.currentState }),
          ...(req.assignedPersonaId !== undefined && { assignedPersonaId: req.assignedPersonaId }),
        };
        queryClient.setQueryData<Task | null>(queryKeys.task(id), updated);
      }
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.task(variables.id), context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.id) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: TaskId) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ── Task Edge queries ─────────────────────────────────────────────

export function useTaskEdges(taskId?: TaskId) {
  return useQuery({
    queryKey: queryKeys.taskEdges(taskId),
    queryFn: () => getTaskEdges(taskId),
  });
}

export function useCreateTaskEdge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateTaskEdgeRequest) => createTaskEdge(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskEdges"] });
    },
  });
}

export function useDeleteTaskEdge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: TaskEdgeId) => deleteTaskEdge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskEdges"] });
    },
  });
}
