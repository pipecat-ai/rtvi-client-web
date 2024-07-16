import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";

import { VoiceEvent, VoiceEvents } from "./events";
import { DailyTransport, Participant, Transport } from "./transport";
import { VoiceClientOptions } from ".";

export type VoiceEventCallbacks = Partial<{
  onConnected: () => void;
  onStateChange: (state: string) => void;
  onDisconnected: () => void;

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

  constructor(options: VoiceClientOptions) {
    super();
    this._baseUrl = options.baseUrl || "https://voice.daily.co/";

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
    //@TODO: Ping webservice here and get url and token
    console.log("Handshaking with web service", this._baseUrl);

    // const { url, token } = await fetch(this._baseUrl).then((res) => res.json());
    await this._transport.connect({
      url: "https://jpt.daily.co/hello", // @NOTE: this will be abstracted by a web service
    });
  }

  public async disconnect() {
    await this._transport.disconnect();
  }
}
