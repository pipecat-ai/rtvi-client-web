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
  local: boolean;
};

export abstract class Transport {
  protected _callbacks: VoiceEventCallbacks;

  constructor(callbacks: VoiceEventCallbacks) {
    this._callbacks = callbacks;
  }

  abstract connect({ url }: { url: string }): Promise<void>;

  abstract disconnect(): Promise<void>;
}
