import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PersonaId, CreatePersonaRequest, UpdatePersonaRequest } from "@agentops/shared";
import {
  getPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
} from "@/api";
import { queryKeys } from "./query-keys";

export function usePersonas() {
  return useQuery({
    queryKey: queryKeys.personas,
    queryFn: getPersonas,
  });
}

export function usePersona(id: PersonaId) {
  return useQuery({
    queryKey: queryKeys.persona(id),
    queryFn: () => getPersona(id),
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreatePersonaRequest) => createPersona(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas });
    },
  });
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...req }: UpdatePersonaRequest & { id: PersonaId }) =>
      updatePersona(id, req),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas });
      queryClient.invalidateQueries({ queryKey: queryKeys.persona(variables.id) });
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: PersonaId) => deletePersona(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.persona(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.personas });
    },
  });
}
