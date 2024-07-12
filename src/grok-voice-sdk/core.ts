import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";

import { VoiceEvent, VoiceEvents } from "./events";
import { DailyTransport, Participant, Transport } from "./transport";

export type VoiceEventCallbacks = {
  onConnected?: () => void;
  onStateChange?: (state: string) => void;
  onDisconnected?: () => void;

  // Not yet implemented
  onBotConnected?: (participant: Participant) => void;
  onBotDisconnected?: (participant: Participant) => void;
  onTrackStarted?: (track: MediaStreamTrack) => void;
  onTrackStopped?: (track: MediaStreamTrack) => void;

  // Stretch
  onTextFrame?: (text: string) => void;
  onLocalAudioLevel?: (level: number) => void;
  onRemoteAudioLevel?: (level: number) => void;
  onTranscription?: (transcription: string) => void;
};

export abstract class Client extends (EventEmitter as new () => TypedEmitter<VoiceEvents>) {
  private _transport: Transport;
  private _callbacks: VoiceEventCallbacks;
  private readonly _baseUrl: string;

  constructor({
    baseUrl,
    callbacks,
    transport,
  }: {
    baseUrl: string | undefined;
    callbacks: VoiceEventCallbacks;
    transport: new () => Transport | undefined;
  }) {
    super();
    this._baseUrl = baseUrl || "https://voice.daily.co/";

    // Wrap transport callbacks with events for developer convenience
    const wrappedCallbacks: VoiceEventCallbacks = {
      ...callbacks,
      onStateChange: (state) => {
        callbacks.onStateChange?.(state);
        this.emit(VoiceEvent.TransportStateChanged, state);
      },
    };

    this._callbacks = wrappedCallbacks;

    // Instantiate the transport
    this._transport = transport ? new transport()! : new DailyTransport();
  }

  public async start() {
    //@TODO: Ping webservice here and get url and token
    console.log("Handshaking with web service", this._baseUrl);

    // const { url, token } = await fetch(this._baseUrl).then((res) => res.json());

    await this._transport.connect({
      url: "https://jpt.daily.co/hello", // @NOTE: this will be abstracted by a web service
    });

    this.emit(VoiceEvent.Started);
  }

  public async disconnect() {
    await this._transport.disconnect();
    this._callbacks.onDisconnected?.();

    this.emit(VoiceEvent.Disconnected);
  }
}
