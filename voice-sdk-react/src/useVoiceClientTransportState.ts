import { TransportState, VoiceEvent } from "@realtime-ai/voice-sdk";
import { useVoiceClientEvent } from "./useVoiceClientEvent";
import { atom, useAtom } from "jotai";

const transportStateAtom = atom<TransportState>(TransportState.Idle);

export const useVoiceClientTransportState = () => {
  const [transportState, setTransportState] = useAtom(transportStateAtom);

  useVoiceClientEvent(VoiceEvent.TransportStateChanged, setTransportState);

  return transportState;
};
