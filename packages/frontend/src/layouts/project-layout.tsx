import { Outlet, useNavigate } from "react-router";
import { useProjectFromUrl } from "@/hooks";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectLayout() {
  const { projectId, project, isLoading } = useProjectFromUrl();
  const navigate = useNavigate();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 404: projectId in URL but project not found
  if (projectId && !project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">
          Project not found
        </p>
        <p className="text-xs text-muted-foreground/60">
          The project &ldquo;{projectId}&rdquo; doesn&rsquo;t exist or was
          deleted.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => navigate("/")}
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return <Outlet />;
}
