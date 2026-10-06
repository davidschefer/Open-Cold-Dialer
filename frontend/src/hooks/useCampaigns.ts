import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import type { Database } from "@/types/database";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignInput = { name: string; type: string; status: string; settings: Record<string, unknown> | null };

export function useCampaigns() {
  return useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: () => api.campaigns.list(),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation<Campaign, Error, CampaignInput>({
    mutationFn: ({ name, type, status, settings }) => api.campaigns.create({ name, type, status, settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation<Campaign, Error, Partial<CampaignInput> & { id: string }>({
    mutationFn: ({ id, ...updates }) => api.campaigns.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => api.campaigns.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
