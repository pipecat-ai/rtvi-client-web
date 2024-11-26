import { useEffect } from "react";
import type { RTVIEvent, RTVIEventHandler } from "realtime-ai";
import { useRTVIClient } from "./useRTVIClient";

export const useRTVIClientEvent = <E extends RTVIEvent>(
  event: E,
  handler: RTVIEventHandler<E>
) => {
  const client = useRTVIClient();

  useEffect(() => {
    if (!client) return;
    client.on(event, handler);
    return () => {
      client.off(event, handler);
    };
  }, [event, handler, client]);
};
