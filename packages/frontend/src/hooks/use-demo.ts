import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import {
  startDemo,
  stopDemo,
  isDemoRunning,
  onDemoStop,
} from "@/mocks/demo";

export interface DemoState {
  running: boolean;
  elapsed: number; // seconds
}

const DEMO_DURATION = 61; // total demo length in seconds

export function useDemo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<DemoState>({
    running: isDemoRunning(),
    elapsed: 0,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start elapsed timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.elapsed >= DEMO_DURATION) return prev;
        return { ...prev, elapsed: prev.elapsed + 1 };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isDemoRunning()) return;
    setState({ running: true, elapsed: 0 });
    startDemo();
    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    stopDemo();
    stopTimer();
    setState({ running: false, elapsed: 0 });
    // Remove ?demo=true from URL if present
    if (searchParams.has("demo")) {
      searchParams.delete("demo");
      setSearchParams(searchParams, { replace: true });
    }
  }, [stopTimer, searchParams, setSearchParams]);

  // Register stop callback for when demo completes naturally
  useEffect(() => {
    onDemoStop(() => {
      stopTimer();
      setState({ running: false, elapsed: 0 });
    });
  }, [stopTimer]);

  // Auto-start from ?demo=true
  useEffect(() => {
    if (searchParams.get("demo") === "true" && !isDemoRunning()) {
      start();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const progress = Math.min(state.elapsed / DEMO_DURATION, 1);

  return {
    running: state.running,
    elapsed: state.elapsed,
    progress,
    start,
    stop,
  };
}
