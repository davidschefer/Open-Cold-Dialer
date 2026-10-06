import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import type { Database } from "@/types/database";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export function useLeads() {
  return useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: () => api.leads.list(),
  });
}

export function useLead(leadId: string) {
  return useQuery<Lead>({
    queryKey: ["leads", leadId],
    queryFn: () => api.leads.get(leadId),
    enabled: !!leadId,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, Omit<Lead, "id" | "created_at" | "updated_at" | "call_count">>({
    mutationFn: (lead) => api.leads.create(lead),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, Partial<Lead> & { id: string }>({
    mutationFn: ({ id, ...updates }) => api.leads.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.leads.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  return useMutation<{ imported: number; total: number }, Error, Record<string, string | undefined>[]>({
    mutationFn: (rows) => api.leads.import(rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
