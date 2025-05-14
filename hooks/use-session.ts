import { useAuth } from "@/hooks/use-auth";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { Session, InsertSession, UpdateSession } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function useSession(id?: number) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: session, isLoading, error } = useQuery<Session>({
    queryKey: id ? ["/api/sessions", id] : ["/api/sessions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id && !!user,
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, session }: { id: number, session: UpdateSession }) => {
      const res = await apiRequest("PUT", `/api/sessions/${id}`, session);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Work session updated",
        description: "Your work session has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update work session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Work session deleted",
        description: "Your work session has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete work session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    session,
    isLoading,
    error,
    updateSessionMutation,
    deleteSessionMutation,
  };
}

export function useSessions() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: sessions, isLoading, error } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (session: InsertSession) => {
      const res = await apiRequest("POST", "/api/sessions", session);
      return await res.json();
    },
    onSuccess: (session: Session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Work session created",
        description: "Your work session has been created successfully",
      });
      return session;
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create work session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, session }: { id: number, session: UpdateSession }) => {
      const res = await apiRequest("PUT", `/api/sessions/${id}`, session);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Work session updated",
        description: "Your work session has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update work session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Work session deleted",
        description: "Your work session has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete work session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sessions: sessions || [],
    isLoading,
    error,
    createSessionMutation,
    updateSessionMutation,
    deleteSessionMutation,
  };
}