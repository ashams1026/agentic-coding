import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

export function useThemeSync() {
  const theme = useUIStore((s) => s.theme);
  const density = useUIStore((s) => s.density);

  useEffect(() => {
    const root = document.documentElement;

    function apply(isDark: boolean) {
      root.classList.toggle("dark", isDark);
    }

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }

    apply(theme === "dark");
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-density", density);
  }, [density]);
}
