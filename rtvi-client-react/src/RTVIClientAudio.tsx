import { useEffect, useRef } from "react";
import { useRTVIClientMediaTrack } from "./useRTVIClientMediaTrack";

export const RTVIClientAudio = () => {
  const botAudioRef = useRef<HTMLAudioElement>(null);
  const botAudioTrack = useRTVIClientMediaTrack("audio", "bot");

  useEffect(() => {
    if (!botAudioRef.current || !botAudioTrack) return;
    if (botAudioRef.current.srcObject) {
      const oldTrack = (
        botAudioRef.current.srcObject as MediaStream
      ).getAudioTracks()[0];
      if (oldTrack.id === botAudioTrack.id) return;
    }
    botAudioRef.current.srcObject = new MediaStream([botAudioTrack]);
  }, [botAudioTrack]);

  return (
    <>
      <audio ref={botAudioRef} autoPlay />
    </>
  );
};
