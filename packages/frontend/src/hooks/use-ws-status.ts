import { useSyncExternalStore } from "react";
import { getWsStatus, onWsStatusChange } from "@/api/ws";
import type { WsConnectionStatus } from "@/api/ws";

export function useWsStatus(): WsConnectionStatus {
  return useSyncExternalStore(onWsStatusChange, getWsStatus);
}
