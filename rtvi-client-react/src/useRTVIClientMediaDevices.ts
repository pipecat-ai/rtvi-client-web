import { atom, useAtomValue } from "jotai";
import { useRTVIClient } from "./useRTVIClient";
import { useCallback } from "react";
import { useRTVIClientEvent } from "./useRTVIClientEvent";
import { RTVIEvent } from "realtime-ai";
import { useAtomCallback } from "jotai/utils";

type OptionalMediaDeviceInfo = MediaDeviceInfo | Record<string, never>;

const availableMicsAtom = atom<MediaDeviceInfo[]>([]);
const availableCamsAtom = atom<MediaDeviceInfo[]>([]);
const selectedMicAtom = atom<OptionalMediaDeviceInfo>({});
const selectedCamAtom = atom<OptionalMediaDeviceInfo>({});

export const useRTVIClientMediaDevices = () => {
  const client = useRTVIClient();

  const availableCams = useAtomValue(availableCamsAtom);
  const availableMics = useAtomValue(availableMicsAtom);
  const selectedCam = useAtomValue(selectedCamAtom);
  const selectedMic = useAtomValue(selectedMicAtom);

  useRTVIClientEvent(
    RTVIEvent.AvailableCamsUpdated,
    useAtomCallback(
      useCallback((_get, set, cams) => {
        set(availableCamsAtom, cams);
      }, [])
    )
  );
  useRTVIClientEvent(
    RTVIEvent.AvailableMicsUpdated,
    useAtomCallback(
      useCallback((_get, set, mics) => {
        set(availableMicsAtom, mics);
      }, [])
    )
  );
  useRTVIClientEvent(
    RTVIEvent.CamUpdated,
    useAtomCallback(
      useCallback((_get, set, cam) => {
        set(selectedCamAtom, cam);
      }, [])
    )
  );
  useRTVIClientEvent(
    RTVIEvent.MicUpdated,
    useAtomCallback(
      useCallback((_get, set, mic) => {
        set(selectedMicAtom, mic);
      }, [])
    )
  );

  const updateCam = useCallback(
    (id: string) => {
      client?.updateCam(id);
    },
    [client]
  );
  const updateMic = useCallback(
    (id: string) => {
      client?.updateMic(id);
    },
    [client]
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
