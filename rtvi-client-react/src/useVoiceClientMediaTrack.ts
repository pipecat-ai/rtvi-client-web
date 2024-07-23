import { Tracks, VoiceEvent } from "realtime-ai";
import { useVoiceClientEvent } from "./useVoiceClientEvent";
import { useCallback } from "react";
import { atom, useAtomValue } from "jotai";
import { atomFamily, useAtomCallback } from "jotai/utils";
import { Atom } from "jotai/vanilla";

type ParticipantType = keyof Tracks;
type TrackType = keyof Tracks["local"];

const localAudioTrackAtom = atom<MediaStreamTrack | null>(null);
const localVideoTrackAtom = atom<MediaStreamTrack | null>(null);
const botAudioTrackAtom = atom<MediaStreamTrack | null>(null);
const botVideoTrackAtom = atom<MediaStreamTrack | null>(null);

const trackAtom = atomFamily<
  { local: boolean; trackType: TrackType },
  Atom<MediaStreamTrack | null>
>(({ local, trackType }) => {
  if (local)
    return trackType === "audio" ? localAudioTrackAtom : localVideoTrackAtom;
  return trackType === "audio" ? botAudioTrackAtom : botVideoTrackAtom;
});

export const useVoiceClientMediaTrack = (
  trackType: TrackType,
  participantType: ParticipantType
) => {
  const track = useAtomValue(
    trackAtom({ local: participantType === "local", trackType })
  );

  useVoiceClientEvent(
    VoiceEvent.TrackStarted,
    useAtomCallback(
      useCallback(
        (get, set, t, p) => {
          const atom = p?.local
            ? t.kind === "audio"
              ? localAudioTrackAtom
              : localVideoTrackAtom
            : t.kind === "audio"
            ? botAudioTrackAtom
            : botVideoTrackAtom;
          const oldTrack = get(atom);
          if (oldTrack?.id === t.id) return;
          set(atom, t);
        },
        [participantType, track, trackType]
      )
    )
  );

  return track;
};
