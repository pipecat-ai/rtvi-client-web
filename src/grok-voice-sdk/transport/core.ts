import { VoiceEventCallbacks } from "../core";

export enum TransportState {
  Idle = "idle",
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
  Error = "error",
}

export type Participant = {
  id: string;
  name: string;
  isLocal: boolean;
};

export abstract class Transport {
  protected declare _callbacks: VoiceEventCallbacks;

  constructor(callbacks: VoiceEventCallbacks) {
    this._callbacks = callbacks;
  }

  abstract connect({ url }: { url: string }): void;

  abstract disconnect(): void;
}
