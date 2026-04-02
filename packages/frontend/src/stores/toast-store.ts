import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  critical?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  overflowCount: number;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ── Store ──────────────────────────────────────────────────────────

let nextId = 0;

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 5000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  overflowCount: 0,

  addToast: (toast) => {
    const id = `toast-${++nextId}`;
    const newToast = { ...toast, id };

    set((state) => {
      const updated = [...state.toasts, newToast];
      const overflow = Math.max(0, updated.length - MAX_VISIBLE);
      return {
        toasts: updated.slice(-MAX_VISIBLE),
        overflowCount: overflow,
      };
    });

    // Auto-dismiss — skip for critical toasts
    if (!toast.critical) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
          overflowCount: Math.max(0, state.overflowCount - (state.toasts.some((t) => t.id === id) ? 1 : 0)),
        }));
      }, AUTO_DISMISS_MS);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
