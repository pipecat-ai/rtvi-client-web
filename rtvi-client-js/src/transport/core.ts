import { VoiceClientConfigOption, VoiceClientOptions, VoiceMessage } from "..";
import { VoiceEventCallbacks } from "../core";

export type TransportState =
  | "idle"
  | "initializing"
  | "initialized"
  | "authenticating"
  | "connecting"
  | "connected"
  | "ready"
  | "disconnected"
  | "error";

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
  protected _config: VoiceClientConfigOption[];
  protected _onMessage: (ev: VoiceMessage) => void;
  protected _state: TransportState = "idle";
  protected _expiry?: number = undefined;

  constructor(
    options: VoiceClientOptions,
    onMessage: (ev: VoiceMessage) => void
  ) {
    this._options = options;
    this._callbacks = options.callbacks ?? {};
    this._config = options.config ?? [];
    this._onMessage = onMessage;
  }

  abstract initDevices(): Promise<void>;

  abstract connect(
    authBundle: unknown,
    abortController: AbortController
  ): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendReadyMessage(): void;

  abstract getAllMics(): Promise<MediaDeviceInfo[]>;
  abstract getAllCams(): Promise<MediaDeviceInfo[]>;

  abstract updateMic(micId: string): void;
  abstract updateCam(camId: string): void;

  abstract get selectedMic(): MediaDeviceInfo | Record<string, never>;
  abstract get selectedCam(): MediaDeviceInfo | Record<string, never>;

  abstract enableMic(enable: boolean): void;
  abstract enableCam(enable: boolean): void;

  abstract get isCamEnabled(): boolean;
  abstract get isMicEnabled(): boolean;

  abstract sendMessage(message: VoiceMessage): void;

  abstract get state(): TransportState;
  abstract set state(state: TransportState);

  get expiry(): number | undefined {
    return this._expiry
  };

  abstract tracks(): Tracks;
}
