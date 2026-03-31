import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSessionId } from "@agentops/shared";

interface PicoState {
  isOpen: boolean;
  hasUnread: boolean;
  currentSessionId: ChatSessionId | null;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setHasUnread: (unread: boolean) => void;
  setCurrentSessionId: (id: ChatSessionId | null) => void;
}

export const usePicoStore = create<PicoState>()(
  persist(
    (set) => ({
      isOpen: false,
      hasUnread: false,
      currentSessionId: null,

      setOpen: (open) => set({ isOpen: open, ...(open ? { hasUnread: false } : {}) }),
      toggleOpen: () =>
        set((s) => ({
          isOpen: !s.isOpen,
          ...(s.isOpen ? {} : { hasUnread: false }),
        })),
      setHasUnread: (hasUnread) => set({ hasUnread }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
    }),
    { name: "pico-chat" },
  ),
);
