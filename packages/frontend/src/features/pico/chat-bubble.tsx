import { Dog } from "lucide-react";
import { usePicoStore } from "./pico-store";

export function ChatBubble() {
  const { isOpen, hasUnread, toggleOpen } = usePicoStore();

  return (
    <button
      onClick={toggleOpen}
      aria-label={isOpen ? "Close Pico chat" : "Open Pico chat"}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 animate-pico-bounce-in"
      style={{ backgroundColor: "#f59e0b" }}
    >
      <Dog className="h-7 w-7 text-white" />
      {hasUnread && !isOpen && (
        <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-destructive" />
      )}
    </button>
  );
}
