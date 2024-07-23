import { Tracks, VoiceEvent } from "realtime-ai";
import { useVoiceClientEvent } from "./useVoiceClientEvent";
import { useCallback, useState } from "react";

type ParticipantType = keyof Tracks;
type TrackType = keyof Tracks["local"];

export const useVoiceClientMediaTrack = (
  trackType: TrackType,
  participantType: ParticipantType
) => {
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);
  const isLocal = participantType === "local";

  useVoiceClientEvent(
    VoiceEvent.TrackStarted,
    useCallback(
      (t, p) => {
        if (isLocal !== p?.local || t.kind !== trackType || t.id === track?.id)
          return;
        setTrack(t);
      },
      [participantType, track, trackType]
    )
  );

  return track;
};
