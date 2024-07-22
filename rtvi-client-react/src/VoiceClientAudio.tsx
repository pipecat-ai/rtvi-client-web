import { useCallback, useRef } from "react";
import { useVoiceClientEvent } from "./useVoiceClientEvent";
import { VoiceEvent } from "realtime-ai";

export const VoiceClientAudio = () => {
  const botAudioRef = useRef<HTMLAudioElement>(null);

  useVoiceClientEvent(
    VoiceEvent.TrackStarted,
    useCallback((track, p) => {
      if (p?.local || !botAudioRef.current) return;
      if (botAudioRef.current.srcObject) {
        const oldTrack = (
          botAudioRef.current.srcObject as MediaStream
        ).getAudioTracks()[0];
        if (oldTrack.id === track.id) return;
      }
      botAudioRef.current.srcObject = new MediaStream([track]);
    }, [])
  );

  return (
    <>
      <audio ref={botAudioRef} autoPlay />
    </>
  );
};
