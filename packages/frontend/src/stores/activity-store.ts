import { create } from "zustand";

interface ActivityState {
  /** Number of new activity events since user last viewed the feed */
  unreadCount: number;

  increment: () => void;
  reset: () => void;
}

export const useActivityStore = create<ActivityState>()((set) => ({
  unreadCount: 0,
  increment: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  reset: () => set({ unreadCount: 0 }),
}));
