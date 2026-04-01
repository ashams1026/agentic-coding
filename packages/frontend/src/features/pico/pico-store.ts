import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatSessionId } from "@agentops/shared";

interface PicoState {
  isOpen: boolean;
  hasUnread: boolean;
  currentSessionId: ChatSessionId | null;
  panelWidth: number;
  panelHeight: number;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setHasUnread: (unread: boolean) => void;
  setCurrentSessionId: (id: ChatSessionId | null) => void;
  setPanelSize: (width: number, height: number) => void;
}

export const usePicoStore = create<PicoState>()(
  persist(
    (set) => ({
      isOpen: false,
      hasUnread: false,
      currentSessionId: null,
      panelWidth: 400,
      panelHeight: 500,

      setOpen: (open) => set({ isOpen: open, ...(open ? { hasUnread: false } : {}) }),
      toggleOpen: () =>
        set((s) => ({
          isOpen: !s.isOpen,
          ...(s.isOpen ? {} : { hasUnread: false }),
        })),
      setHasUnread: (hasUnread) => set({ hasUnread }),
      setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
      setPanelSize: (panelWidth, panelHeight) => set({ panelWidth, panelHeight }),
    }),
    { name: "pico-chat" },
  ),
);
