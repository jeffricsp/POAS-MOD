import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/use-auth";

interface ShellProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function Shell({ children, requireAuth = true }: ShellProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (requireAuth && isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-full" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // If auth is not required (e.g. public survey link), render without sidebar
  if (!requireAuth) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  // If auth is required but not authenticated, the useAuth hook will handle redirect usually,
  // or we render a login prompt. Here we assume App.tsx handles the protect logic,
  // so if we are here, we are good to render layout.

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 overflow-auto h-screen w-full">
        <div className="container max-w-7xl mx-auto p-6 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
