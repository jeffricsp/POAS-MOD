import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Survey } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSurveys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [api.surveys.list.path],
    queryFn: async () => {
      const res = await fetch(api.surveys.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch surveys");
      return api.surveys.list.responses[200].parse(await res.json());
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const validated = api.surveys.create.input.parse(data);
      const res = await fetch(api.surveys.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create survey");
      return api.surveys.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.surveys.list.path] });
      toast({ title: "Success", description: "Survey created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return { ...query, createMutation };
}

export function useMySurveys() {
  return useQuery<Survey[]>({
    queryKey: ['/api/my-surveys'],
    queryFn: async () => {
      const res = await fetch('/api/my-surveys', { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch surveys");
      return res.json();
    },
  });
}

export function useSurvey(id: number) {
  return useQuery({
    queryKey: [api.surveys.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.surveys.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch survey");
      return api.surveys.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useSubmitSurvey(id: number) {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const url = buildUrl(api.surveys.submit.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit survey");
      return api.surveys.submit.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({ title: "Submitted", description: "Thank you for your feedback!" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
