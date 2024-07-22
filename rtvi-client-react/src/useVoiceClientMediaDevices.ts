import { atom, useAtomValue } from "jotai";
import { useVoiceClient } from "./useVoiceClient";
import { useCallback } from "react";
import { useVoiceClientEvent } from "./useVoiceClientEvent";
import { VoiceEvent } from "realtime-ai";
import { useAtomCallback } from "jotai/utils";

type OptionalMediaDeviceInfo = MediaDeviceInfo | Record<string, never>;

const availableMicsAtom = atom<MediaDeviceInfo[]>([]);
const availableCamsAtom = atom<MediaDeviceInfo[]>([]);
const selectedMicAtom = atom<OptionalMediaDeviceInfo>({});
const selectedCamAtom = atom<OptionalMediaDeviceInfo>({});

export const useVoiceClientMediaDevices = () => {
  const voiceClient = useVoiceClient();

  const availableCams = useAtomValue(availableCamsAtom);
  const availableMics = useAtomValue(availableMicsAtom);
  const selectedCam = useAtomValue(selectedCamAtom);
  const selectedMic = useAtomValue(selectedMicAtom);

  useVoiceClientEvent(
    VoiceEvent.AvailableCamsUpdated,
    useAtomCallback(
      useCallback((_get, set, cams) => {
        set(availableCamsAtom, cams);
      }, [])
    )
  );
  useVoiceClientEvent(
    VoiceEvent.AvailableMicsUpdated,
    useAtomCallback(
      useCallback((_get, set, mics) => {
        set(availableMicsAtom, mics);
      }, [])
    )
  );
  useVoiceClientEvent(
    VoiceEvent.CamUpdated,
    useAtomCallback(
      useCallback((_get, set, cam) => {
        set(selectedCamAtom, cam);
      }, [])
    )
  );
  useVoiceClientEvent(
    VoiceEvent.MicUpdated,
    useAtomCallback(
      useCallback((_get, set, mic) => {
        set(selectedMicAtom, mic);
      }, [])
    )
  );

  const updateCam = useCallback(
    (id: string) => {
      voiceClient?.updateCam(id);
    },
    [voiceClient]
  );
  const updateMic = useCallback(
    (id: string) => {
      voiceClient?.updateMic(id);
    },
    [voiceClient]
  );

  return {
    availableCams,
    availableMics,
    selectedCam,
    selectedMic,
    updateCam,
    updateMic,
  };
};
