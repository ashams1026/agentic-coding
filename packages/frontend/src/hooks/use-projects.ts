import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectId, CreateProjectRequest, UpdateProjectRequest } from "@agentops/shared";
import { getProjects, getProject, createProject, updateProject, deleteProject } from "@/api";
import { queryKeys } from "./query-keys";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: getProjects,
  });
}

export function useProject(id: ProjectId) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => getProject(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateProjectRequest) => createProject(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdateProjectRequest & { id: ProjectId }) =>
      updateProject(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(variables.id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: ProjectId) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}
