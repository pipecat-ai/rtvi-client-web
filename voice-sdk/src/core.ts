import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";

import { VoiceEvent, VoiceEvents } from "./events";
import { DailyTransport, Participant, Transport } from "./transport";
import * as VoiceErrors from "./errors";
import { VoiceClientOptions } from ".";

export type VoiceEventCallbacks = Partial<{
  onConnected: () => void;
  onDisconnected: () => void;
  onStateChange: (state: string) => void;

  onBotConnected: (participant: Participant) => void;
  onBotDisconnected: (participant: Participant) => void;

  onParticipantJoined: (participant: Participant) => void;
  onParticipantLeft: (participant: Participant) => void;

  onTrackStarted: (track: MediaStreamTrack, participant?: Participant) => void;
  onTrackStopped: (track: MediaStreamTrack, participant?: Participant) => void;

  onLocalAudioLevel: (level: number) => void;
  onRemoteAudioLevel: (level: number, participant: Participant) => void;

  onBotStartedTalking: (participant: Participant) => void;
  onBotStoppedTalking: (participant: Participant) => void;
  onLocalStartedTalking: () => void;
  onLocalStoppedTalking: () => void;

  // @@ Not yet implemented @@
  // onTextFrame: (text: string) => void;
}>;

export abstract class Client extends (EventEmitter as new () => TypedEmitter<VoiceEvents>) {
  private _transport: Transport;
  private readonly _baseUrl: string;
  private readonly _apiKey: string;

  constructor(options: VoiceClientOptions) {
    super();
    this._baseUrl = options.baseUrl || "https://rtvi.pipecat.bot";
    this._apiKey = options.apiKey;

    // Wrap transport callbacks with events for developer convenience
    const wrappedCallbacks: VoiceEventCallbacks = {
      ...options.callbacks,
      onConnected: () => {
        options?.callbacks?.onConnected?.();
        this.emit(VoiceEvent.Connected);
      },
      onDisconnected: () => {
        options?.callbacks?.onDisconnected?.();
        this.emit(VoiceEvent.Disconnected);
      },
      onStateChange: (state) => {
        options?.callbacks?.onStateChange?.(state);
        this.emit(VoiceEvent.TransportStateChanged, state);
      },
      onParticipantJoined: (p) => {
        options?.callbacks?.onParticipantJoined?.(p);
        this.emit(VoiceEvent.ParticipantConnected, p);
      },
      onParticipantLeft: (p) => {
        options?.callbacks?.onParticipantLeft?.(p);
        this.emit(VoiceEvent.ParticipantLeft, p);
      },
      onTrackStarted: (track, p) => {
        options?.callbacks?.onTrackStarted?.(track, p);
        this.emit(VoiceEvent.TrackStarted, track, p);
      },
      onTrackStopped: (track, p) => {
        options?.callbacks?.onTrackStopped?.(track, p);
        this.emit(VoiceEvent.TrackedStopped, track, p);
      },
      onBotStartedTalking: (p) => {
        options?.callbacks?.onBotStartedTalking?.(p);
        this.emit(VoiceEvent.BotStartedTalking, p);
      },
      onBotStoppedTalking: (p) => {
        options?.callbacks?.onBotStoppedTalking?.(p);
        this.emit(VoiceEvent.BotStoppedTalking, p);
      },
      onRemoteAudioLevel: (level, p) => {
        options?.callbacks?.onRemoteAudioLevel?.(level, p);
        this.emit(VoiceEvent.RemoteAudioLevel, level, p);
      },
      onLocalStartedTalking: () => {
        options?.callbacks?.onLocalStartedTalking?.();
        this.emit(VoiceEvent.LocalStartedTalking);
      },
      onLocalStoppedTalking: () => {
        options?.callbacks?.onLocalStoppedTalking?.();
        this.emit(VoiceEvent.LocalStoppedTalking);
      },
      onLocalAudioLevel: (level) => {
        options?.callbacks?.onLocalAudioLevel?.(level);
        this.emit(VoiceEvent.LocalAudioLevel, level);
      },
    };

    // Instantiate the transport
    this._transport = options?.config?.transport
      ? new options.config.transport({
          ...options,
          callbacks: wrappedCallbacks,
        })!
      : new DailyTransport({
          ...options,
          callbacks: wrappedCallbacks,
        });
  }

  public async start() {
    if (!this._apiKey) {
      throw new Error("API Key is required");
    }

    /**
     * SOF: placeholder service-side logic
     */
    // Handshake with the server to get the room and token
    // Note: this should be done on the server side
    const { room, token } = await fetch(`${this._baseUrl}/authenticate`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._apiKey}`,
      },
    }).then((res) => res.json());

    if (!room || !token) {
      // In lieu of proper error codes, a failed authentication indicates
      // the server is busy.
      throw new VoiceErrors.RateLimitError();
    }
    /**
     * EOF: placeholder service-side logic
     */

    try {
      await fetch(`${this._baseUrl}/start_bot`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room }),
      });
    } catch {
      throw new VoiceErrors.BotStartError(`Failed to start bot at URL ${room}`);
    }

    await this._transport.connect({
      url: room,
      token,
    });
  }

  public async disconnect() {
    await this._transport.disconnect();
  }

  public enableMic(enable: boolean) {
    this._transport.enableMic(enable);
  }

  public get isMicEnabled(): boolean {
    return this._transport.isMicEnabled;
  }

  public enableCam(enable: boolean) {
    this._transport.enableCam(enable);
  }

  public get isCamEnabled(): boolean {
    return this._transport.isCamEnabled;
  }

  public tracks() {
    return this._transport.tracks();
  }
}
