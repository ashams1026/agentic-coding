import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToastStore, type ToastType } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

// ── Toast config ───────────────────────────────────────────────────

const toastConfig: Record<
  ToastType,
  { icon: typeof CheckCircle2; color: string; bg: string }
> = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600 dark:text-green-400",
    bg: "border-green-200 dark:border-green-800/50",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600 dark:text-red-400",
    bg: "border-red-200 dark:border-red-800/50",
  },
  info: {
    icon: Info,
    color: "text-blue-600 dark:text-blue-400",
    bg: "border-blue-200 dark:border-blue-800/50",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600 dark:text-amber-400",
    bg: "border-amber-200 dark:border-amber-800/50",
  },
};

// ── Component ──────────────────────────────────────────────────────

export function ToastRenderer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border bg-card p-3 shadow-lg",
              "animate-in slide-in-from-right-full fade-in duration-300",
              config.bg,
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.color)} />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {toast.description}
                </p>
              )}
              {toast.action && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mt-1 text-xs"
                  onClick={() => {
                    toast.action!.onClick();
                    removeToast(toast.id);
                  }}
                >
                  {toast.action.label}
                </Button>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
