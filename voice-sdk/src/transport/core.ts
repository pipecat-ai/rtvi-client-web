import { VoiceClientConfigOptions, VoiceClientOptions } from "..";
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

export type Tracks = {
  local: {
    audio?: MediaStreamTrack;
    video?: MediaStreamTrack;
  };
  bot?: {
    audio?: MediaStreamTrack;
    video?: MediaStreamTrack;
  };
};

export abstract class Transport {
  protected _options: VoiceClientOptions;
  protected _callbacks: VoiceEventCallbacks;
  protected _config: VoiceClientConfigOptions;

  constructor(options: VoiceClientOptions) {
    this._options = options;
    this._callbacks = options.callbacks ?? {};
    this._config = options.config ?? {};
  }

  abstract connect({
    url,
    token,
  }: {
    url: string;
    token: string;
  }): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract enableMic(enable: boolean): void;

  abstract get isMicEnabled(): boolean;

  abstract tracks(): Tracks;
}
