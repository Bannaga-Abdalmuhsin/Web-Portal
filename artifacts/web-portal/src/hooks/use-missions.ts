import { useQueryClient } from "@tanstack/react-query";
import { 
  useListMissions, 
  useCreateMission as useCreateMissionGen,
  useUpdateMission as useUpdateMissionGen,
  useDeleteMission as useDeleteMissionGen,
  getListMissionsQueryKey
} from "@workspace/api-client-react";

export function useMissions() {
  return useListMissions();
}

export function useCreateMission() {
  const queryClient = useQueryClient();
  return useCreateMissionGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMissionsQueryKey() })
    }
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();
  return useUpdateMissionGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMissionsQueryKey() })
    }
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();
  return useDeleteMissionGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListMissionsQueryKey() })
    }
  });
}
