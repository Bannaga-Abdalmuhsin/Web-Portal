import { useQueryClient } from "@tanstack/react-query";
import { 
  useListSites, 
  useCreateSite as useCreateSiteGen,
  useUpdateSite as useUpdateSiteGen,
  useDeleteSite as useDeleteSiteGen,
  getListSitesQueryKey
} from "@workspace/api-client-react";

export function useSites() {
  return useListSites();
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  return useCreateSiteGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() })
    }
  });
}

export function useUpdateSite() {
  const queryClient = useQueryClient();
  return useUpdateSiteGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() })
    }
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  return useDeleteSiteGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSitesQueryKey() })
    }
  });
}
