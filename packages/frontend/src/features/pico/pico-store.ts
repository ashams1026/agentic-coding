import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PicoState {
  isOpen: boolean;
  hasUnread: boolean;

  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setHasUnread: (unread: boolean) => void;
}

export const usePicoStore = create<PicoState>()(
  persist(
    (set) => ({
      isOpen: false,
      hasUnread: false,

      setOpen: (open) => set({ isOpen: open, ...(open ? { hasUnread: false } : {}) }),
      toggleOpen: () =>
        set((s) => ({
          isOpen: !s.isOpen,
          ...(s.isOpen ? {} : { hasUnread: false }),
        })),
      setHasUnread: (hasUnread) => set({ hasUnread }),
    }),
    { name: "pico-chat" },
  ),
);
