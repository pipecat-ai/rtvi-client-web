import { useEffect } from "react";
import type { VoiceEvent, VoiceEventHandler } from "@realtime-ai/voice-sdk";
import { useVoiceClient } from "./useVoiceClient";

export const useVoiceClientEvent = <E extends VoiceEvent>(
  event: E,
  handler: VoiceEventHandler<E>
) => {
  const voiceClient = useVoiceClient();

  useEffect(() => {
    if (!voiceClient) return;
    voiceClient.on(event, handler);
    return () => {
      voiceClient.off(event, handler);
    };
  }, [event, handler, voiceClient]);
};
