import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import type { Database } from "@/types/database";

export type CallScript = Database["public"]["Tables"]["call_scripts"]["Row"];
export type ScriptInput = Pick<
  CallScript,
  "title" | "category" | "content" | "objection_responses" | "campaign_id" | "is_active"
>;

export function useScripts() {
  return useQuery<CallScript[]>({
    queryKey: ["scripts"],
    queryFn: () => api.scripts.list(),
  });
}

export function useCreateScript() {
  const queryClient = useQueryClient();
  return useMutation<CallScript, Error, ScriptInput>({
    mutationFn: (script) => api.scripts.create(script),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();
  return useMutation<CallScript, Error, Partial<ScriptInput> & { id: string }>({
    mutationFn: ({ id, ...script }) => api.scripts.update(id, script),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useDeleteScript() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.scripts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}
