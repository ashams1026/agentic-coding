import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ── Store ──────────────────────────────────────────────────────────

let nextId = 0;

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 5000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++nextId}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-(MAX_TOASTS - 1)), { ...toast, id }],
    }));

    // Auto-dismiss
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, AUTO_DISMISS_MS);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
