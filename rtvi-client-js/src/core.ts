import { deepmergeCustom } from "deepmerge-ts";
import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";

import {
  BotReadyData,
  PipecatMetrics,
  Transcript,
  VoiceClientConfigLLM,
  VoiceClientConfigOption,
  VoiceClientLLMMessage,
  VoiceClientOptions,
  VoiceMessage,
  VoiceMessageMetrics,
  VoiceMessageType,
} from ".";
import * as VoiceErrors from "./errors";
import { VoiceEvent, VoiceEvents } from "./events";
import {
  DailyTransport,
  Participant,
  Transport,
  TransportState,
} from "./transport";
import { AuthBundle } from "./transport/core";

export type VoiceEventCallbacks = Partial<{
  onConnected: () => void;
  onDisconnected: () => void;
  onTransportStateChanged: (state: TransportState) => void;
  onConfigUpdated: (config: VoiceClientConfigOption[]) => void;
  onConfigDescribe: (configDescription: unknown) => void;
  onBotConnected: (participant: Participant) => void;
  onBotReady: (botReadyData: BotReadyData) => void;
  onBotDisconnected: (participant: Participant) => void;
  onParticipantJoined: (participant: Participant) => void;
  onParticipantLeft: (participant: Participant) => void;

  onAvailableCamsUpdated: (cams: MediaDeviceInfo[]) => void;
  onAvailableMicsUpdated: (mics: MediaDeviceInfo[]) => void;
  onCamUpdated: (cam: MediaDeviceInfo) => void;
  onMicUpdated: (cam: MediaDeviceInfo) => void;

  onTrackStarted: (track: MediaStreamTrack, participant?: Participant) => void;
  onTrackStopped: (track: MediaStreamTrack, participant?: Participant) => void;
  onLocalAudioLevel: (level: number) => void;
  onRemoteAudioLevel: (level: number, participant: Participant) => void;
  onBotStartedTalking: (participant: Participant) => void;
  onBotStoppedTalking: (participant: Participant) => void;
  onLocalStartedTalking: () => void;
  onLocalStoppedTalking: () => void;
  onJsonCompletion: (jsonString: string) => void;
  onMetrics: (data: PipecatMetrics) => void;
  onUserTranscript: (data: Transcript) => void;
  onBotTranscript: (data: string) => void;
}>;

export abstract class Client extends (EventEmitter as new () => TypedEmitter<VoiceEvents>) {
  protected _options: VoiceClientOptions;
  private _transport: Transport;
  private readonly _baseUrl: string;
  private _startResolve: ((value: unknown) => void) | undefined;
  private _abortController: AbortController | undefined;
  private _handshakeTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor(options: VoiceClientOptions) {
    super();

    this._baseUrl = options.baseUrl;
    // Wrap transport callbacks with event triggers
    // This allows for either functional callbacks or .on / .off event listeners
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
      onTransportStateChanged: (state: TransportState) => {
        options?.callbacks?.onTransportStateChanged?.(state);
        this.emit(VoiceEvent.TransportStateChanged, state);
      },
      onConfigUpdated: (config: VoiceClientConfigOption[]) => {
        options?.callbacks?.onConfigUpdated?.(config);
        this.emit(VoiceEvent.ConfigUpdated, config);
      },
      onConfigDescribe: (configDescription: unknown) => {
        options?.callbacks?.onConfigDescribe?.(configDescription);
        this.emit(VoiceEvent.ConfigDescribe, configDescription);
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
      onAvailableCamsUpdated: (cams) => {
        options?.callbacks?.onAvailableCamsUpdated?.(cams);
        this.emit(VoiceEvent.AvailableCamsUpdated, cams);
      },
      onAvailableMicsUpdated: (mics) => {
        options?.callbacks?.onAvailableMicsUpdated?.(mics);
        this.emit(VoiceEvent.AvailableMicsUpdated, mics);
      },
      onCamUpdated: (cam) => {
        options?.callbacks?.onCamUpdated?.(cam);
        this.emit(VoiceEvent.CamUpdated, cam);
      },
      onMicUpdated: (mic) => {
        options?.callbacks?.onMicUpdated?.(mic);
        this.emit(VoiceEvent.MicUpdated, mic);
      },
      onBotConnected: (p) => {
        options?.callbacks?.onBotConnected?.(p);
        this.emit(VoiceEvent.BotConnected, p);
      },
      onBotReady: (botReadyData: BotReadyData) => {
        options?.callbacks?.onBotReady?.(botReadyData);
        this.emit(VoiceEvent.BotReady, botReadyData);
      },
      onBotDisconnected: (p) => {
        options?.callbacks?.onBotDisconnected?.(p);
        this.emit(VoiceEvent.BotDisconnected, p);
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

    // Instantiate the transport class
    this._transport = options?.transport
      ? new options.transport(
          {
            ...options,
            callbacks: wrappedCallbacks,
          },
          this.handleMessage.bind(this)
        )!
      : new DailyTransport(
          {
            ...options,
            callbacks: wrappedCallbacks,
          },
          this.handleMessage.bind(this)
        );

    // Update options to reference wrapped callbacks
    this._options = {
      ...options,
      callbacks: wrappedCallbacks,
    };
  }

  // ------ Transport methods
  public async initDevices() {
    await this._transport.initDevices();
  }

  public async start() {
    this._abortController = new AbortController();

    // Establish transport session and await bot ready signal
    return new Promise((resolve, reject) => {
      (async () => {
        this._startResolve = resolve;

        if (this._transport.state === "idle") {
          await this._transport.initDevices();
        }

        this._transport.state = "authenticating";

        const config: VoiceClientConfigOption[] = this._options.config!;

        // Set a timer for the bot to enter a ready state, otherwise abort the attempt
        if (this._options.timeout) {
          this._handshakeTimeout = setTimeout(() => {
            this._abortController?.abort();
            this._transport.disconnect();
            this._transport.state = "error";
            reject(new VoiceErrors.ConnectionTimeoutError());
          }, this._options.timeout);
        }

        // Send POST request to the provided base_url to connect and start the bot
        // @params config - VoiceClientConfigOption[] object with the configuration
        let authBundle: AuthBundle;

        try {
          authBundle = await fetch(`${this._baseUrl}`, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              services: this._options.services,
              config,
            }),
            signal: this._abortController?.signal,
          })
            .then((res) => res.json())
            .catch((res) => {
              if (res.detail) {
                throw new VoiceErrors.TransportAuthBundleError(res.detail);
              }
            });
        } catch (e) {
          clearTimeout(this._handshakeTimeout);
          this._transport.state = "error";
          reject(
            e ||
              new VoiceErrors.TransportAuthBundleError(
                `Failed to connect / invalid auth bundled from provided base url ${this._baseUrl}`
              )
          );
          return;
        }

        try {
          await this._transport.connect(
            authBundle,
            this._abortController as AbortController
          );
        } catch (e) {
          clearTimeout(this._handshakeTimeout);
          reject(e);
          return;
        }
      })();
    });
  }

  public async disconnect() {
    if (this._abortController) {
      this._abortController.abort();
    }
    await this._transport.disconnect();
  }

  public get state(): TransportState {
    return this._transport.state;
  }

  public get services(): { [key: string]: string } {
    return this._options.services;
  }

  // ------ Device methods

  public async getAllMics() {
    return await this._transport.getAllMics();
  }

  public async getAllCams() {
    return await this._transport.getAllCams();
  }

  public get selectedMic() {
    return this._transport.selectedMic;
  }

  public get selectedCam() {
    return this._transport.selectedCam;
  }

  public updateMic(micId: string) {
    this._transport.updateMic(micId);
  }

  public updateCam(camId: string) {
    this._transport.updateCam(camId);
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

  // ------ Config methods

  public get config(): VoiceClientConfigOption[] {
    return this._options.config!;
  }

  /**
   * Set new configuration parameters.
   * Note: this does nothing if the transport is connectd. Use updateConfig method instead
   * @param config - VoiceClientConfigOption[] partial object with the new configuration
   */
  protected set config(config: VoiceClientConfigOption[]) {
    this._options.config = config;
    this._options.callbacks?.onConfigUpdated?.(config);
  }

  /**
   * Update pipeline and seervices
   * @param config - VoiceClientConfigOption[] partial object with the new configuration
   * @param options - Options for the update
   * @param options.useDeepMerge - Whether to use deep merge or shallow merge
   * @param options.sendPartial - Update single service config (e.g. llm or tts) or the whole config
   */
  public updateConfig(
    config: VoiceClientConfigOption[],
    {
      useDeepMerge = false,
      sendPartial = false,
    }: { useDeepMerge?: boolean; sendPartial?: boolean } = {}
  ) {
    if (useDeepMerge) {
      const customMerge = deepmergeCustom({ mergeArrays: false });
      this.config = customMerge(this.config, config);
    } else {
      this.config = config;
    }

    // Only send the partial config if the bot is ready to prevent
    // potential racing conditions whilst pipeline is instantiating
    if (this._transport.state === "ready") {
      this._transport.sendMessage(
        VoiceMessage.config(sendPartial ? config : this.config)
      );
    }
  }

  /**
   * Request the bot to describe its current configuration
   */
  public describeConfig() {
    if (this._transport.state === "ready") {
      this._transport.sendMessage(VoiceMessage.describeConfig());
    }
  }

  // ------ LLM context methods

  public get llmContext(): VoiceClientConfigLLM | undefined {
    //@TODO: Implement
    return undefined;
  }

  /**
   * Merge the current LLM context with a new provided context
   * @param llmConfig - VoiceClientConfigLLM partial object with the new context
   */
  public set llmContext(llmConfig: VoiceClientConfigLLM) {
    console.log(llmConfig);
    /*this.config = {
      ...this._options.config,
      llm: {
        ...this._options.config?.llm,
        ...llmConfig,
      },
    } as VoiceClientConfigOption[];

    if (this._transport.state === "ready") {
      this._transport.sendMessage(VoiceMessage.updateLLMContext(llmConfig));
    }

    this._options.callbacks?.onConfigUpdated?.(this.config);*/
  }

  /**
   * Append a message to the live LLM context. Requires the bot to be connected.
   * @param message - LLM message (role and content)
   */
  public appendLLMContext(
    messages: VoiceClientLLMMessage | VoiceClientLLMMessage[]
  ): void {
    if (this._transport.state === "ready") {
      if (!Array.isArray(messages)) {
        messages = [messages];
      }
      this._transport.sendMessage(VoiceMessage.appendLLMContext(messages));
    } else {
      throw new VoiceErrors.VoiceError(
        "Attempt to update LLM context while transport not in ready state"
      );
    }
  }

  /**
   * Get the session expiry time for the transport session (if applicable)
   */
  public get transportExpiry(): number | undefined {
    if (
      this._transport.state === "connected" ||
      this._transport.state === "ready"
    ) {
      return this._transport.expiry;
    } else {
      throw new VoiceErrors.VoiceError(
        "Attempted to get transport expiry time when transport not in connected or ready state"
      );
    }
  }

  // ------ Handlers
  protected handleMessage(ev: VoiceMessage): void {
    if (ev instanceof VoiceMessageMetrics) {
      this.emit(VoiceEvent.Metrics, ev.data as PipecatMetrics);
      return this._options.callbacks?.onMetrics?.(ev.data as PipecatMetrics);
    }

    switch (ev.type) {
      case VoiceMessageType.BOT_READY:
        clearTimeout(this._handshakeTimeout);
        // Hydrate config with the bot's config
        this.config = (ev.data as BotReadyData).config;
        this._transport.state = "ready";
        this._startResolve?.(ev.data as BotReadyData);
        this._options.callbacks?.onBotReady?.(ev.data as BotReadyData);
        break;
      case VoiceMessageType.CONFIG_AVAILABLE: {
        this._options.callbacks?.onConfigDescribe?.(ev.data);
        break;
      }
      case VoiceMessageType.USER_TRANSCRIPTION: {
        const transcriptData = ev.data as Transcript;
        const transcript = transcriptData as Transcript;
        this._options.callbacks?.onUserTranscript?.(transcript);
        this.emit(VoiceEvent.UserTranscript, transcript);
        break;
      }
      case VoiceMessageType.BOT_TRANSCRIPTION: {
        const botData = ev.data as Transcript;
        this._options.callbacks?.onBotTranscript?.(botData.text as string);
        this.emit(VoiceEvent.BotTranscript, botData.text as string);
        break;
      }
      case VoiceMessageType.JSON_COMPLETION:
        this._options.callbacks?.onJsonCompletion?.(ev.data as string);
        this.emit(VoiceEvent.JSONCompletion, ev.data as string);
        break;
    }
  }
}
