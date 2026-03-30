import { useQueryClient } from "@tanstack/react-query";
import { 
  useListDrivers, 
  useCreateDriver as useCreateDriverGen,
  useUpdateDriver as useUpdateDriverGen,
  useDeleteDriver as useDeleteDriverGen,
  getListDriversQueryKey,
  useListDriverTasks,
  useUpdateDriverTask as useUpdateDriverTaskGen,
  getListDriverTasksQueryKey
} from "@workspace/api-client-react";

export function useDrivers() {
  return useListDrivers();
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useCreateDriverGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() })
    }
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useUpdateDriverGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() })
    }
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useDeleteDriverGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDriversQueryKey() })
    }
  });
}

export function useDriverTasks(driverId: number) {
  return useListDriverTasks({ driverId }, { query: { enabled: !!driverId } as any });
}

export function useUpdateDriverTask() {
  const queryClient = useQueryClient();
  return useUpdateDriverTaskGen({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListDriverTasksQueryKey() })
    }
  });
}
