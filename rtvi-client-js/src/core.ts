import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";

//SOF: move this to LLM helper
export type FunctionCallParams = {
  functionName: string;
  arguments: unknown;
};
export type FunctionCallCallback = (fn: FunctionCallParams) => Promise<unknown>;
// EOF: Move to LLM helper

import {
  ActionData,
  BotReadyData,
  ConfigData,
  LLMFunctionCallData,
  MessageDispatcher,
  PipecatMetrics,
  Transcript,
  VoiceClientConfigOption,
  VoiceClientHelper,
  VoiceClientHelpers,
  VoiceClientOptions,
  VoiceMessage,
  VoiceMessageMetrics,
  VoiceMessageType,
} from ".";
import * as VoiceErrors from "./errors";
import { VoiceEvent, VoiceEvents } from "./events";
import { Participant, Transport, TransportState } from "./transport";

export type VoiceEventCallbacks = Partial<{
  onGenericMessage: (data: unknown) => void;
  onMessageError: (message: VoiceMessage) => void;
  onError: (message: VoiceMessage) => void;
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
  onMicUpdated: (mic: MediaDeviceInfo) => void;

  onTrackStarted: (track: MediaStreamTrack, participant?: Participant) => void;
  onTrackStopped: (track: MediaStreamTrack, participant?: Participant) => void;
  onLocalAudioLevel: (level: number) => void;
  onRemoteAudioLevel: (level: number, participant: Participant) => void;
  onJsonCompletion: (jsonString: string) => void;
  onLLMFunctionCall: (func: LLMFunctionCallData) => void;
  onLLMFunctionCallStart: (functionName: string) => void;
  onBotStartedSpeaking: (participant: Participant) => void;
  onBotStoppedSpeaking: (participant: Participant) => void;
  onUserStartedSpeaking: () => void;
  onUserStoppedSpeaking: () => void;

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
  private _messageDispatcher: MessageDispatcher;
  private _helpers: VoiceClientHelpers;

  // @TODO: move to LLM helper
  private _functionCallCallback: FunctionCallCallback | null;

  constructor(options: VoiceClientOptions) {
    super();

    this._baseUrl = options.baseUrl;
    this._helpers = {};

    //@TODO: move to LLM helper
    this._functionCallCallback = null;

    // Wrap transport callbacks with event triggers
    // This allows for either functional callbacks or .on / .off event listeners
    const wrappedCallbacks: VoiceEventCallbacks = {
      ...options.callbacks,
      onMessageError: (message: VoiceMessage) => {
        options?.callbacks?.onMessageError?.(message);
        this.emit(VoiceEvent.MessageError, message);
      },
      onError: (message: VoiceMessage) => {
        options?.callbacks?.onError?.(message);
        this.emit(VoiceEvent.Error, message);
      },
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
      onBotStartedSpeaking: (p) => {
        options?.callbacks?.onBotStartedSpeaking?.(p);
        this.emit(VoiceEvent.BotStartedSpeaking, p);
      },
      onBotStoppedSpeaking: (p) => {
        options?.callbacks?.onBotStoppedSpeaking?.(p);
        this.emit(VoiceEvent.BotStoppedSpeaking, p);
      },
      onRemoteAudioLevel: (level, p) => {
        options?.callbacks?.onRemoteAudioLevel?.(level, p);
        this.emit(VoiceEvent.RemoteAudioLevel, level, p);
      },
      onUserStartedSpeaking: () => {
        options?.callbacks?.onUserStartedSpeaking?.();
        this.emit(VoiceEvent.UserStartedSpeaking);
      },
      onUserStoppedSpeaking: () => {
        options?.callbacks?.onUserStoppedSpeaking?.();
        this.emit(VoiceEvent.UserStoppedSpeaking);
      },
      onLocalAudioLevel: (level) => {
        options?.callbacks?.onLocalAudioLevel?.(level);
        this.emit(VoiceEvent.LocalAudioLevel, level);
      },
    };

    // Instantiate the transport class
    this._transport = new options.transport!(
      {
        ...options,
        callbacks: wrappedCallbacks,
      },
      this.handleMessage.bind(this)
    )!;

    // Update options to reference wrapped callbacks
    this._options = {
      ...options,
      callbacks: wrappedCallbacks,
    };

    // Create a new message dispatch queue for async message handling
    this._messageDispatcher = new MessageDispatcher(this._transport);
  }

  // ------ Helpers

  /**
   * Register a new helper to the client
   * This (optionally) provides a way to reference the helper directly
   * from the client and use the event dispatcher
   * @param service - Targer service for this helper
   * @param helper - Helper instance
   */
  public registerHelper(
    service: string,
    helper: VoiceClientHelper
  ): VoiceClientHelper {
    if (this._helpers[service]) {
      throw new Error(
        `Helper targeting service '${service}' already registered`
      );
    }

    // Check service exists in config
    if (!this._options.services[service]) {
      throw new Error(
        `Service with name '${service}' not found in the provided services object`
      );
    }

    // Check helper is instance of VoiceClientHelper
    if (!(helper instanceof VoiceClientHelper)) {
      throw new Error(`Helper must be an instance of VoiceClientHelper`);
    }

    // Attach voice client to helper
    helper.voiceClient = this;
    helper.service = service;

    this._helpers[service] = helper;

    return this._helpers[service];
  }

  public getHelper<T extends VoiceClientHelper>(service: string): T {
    const helper = this._helpers[service];
    if (!helper) {
      throw new Error(`Helper targeting service '${service}' not found`);
    }
    return helper as T;
  }

  public unregisterHelper(service: string) {
    if (!this._helpers[service]) {
      throw new Error(`Helper targerting service '${service}' not registered`);
    }
    delete this._helpers[service];
  }

  // ------ Transport methods
  public async initDevices() {
    await this._transport.initDevices();
  }

  public async start() {
    if (
      ["authenticating", "connecting", "connected", "ready"].includes(
        this._transport.state
      )
    ) {
      throw new VoiceErrors.VoiceError("Voice client has already been started");
    }

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
        let authBundle: unknown;

        try {
          authBundle = await fetch(`${this._baseUrl}`, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
              ...this._options.customHeaders,
            },
            body: JSON.stringify({
              services: this._options.services,
              config,
            }),
            signal: this._abortController?.signal,
          }).then((res) => res.json());
        } catch (e) {
          clearTimeout(this._handshakeTimeout);
          this._transport.state = "error";
          reject(
            new VoiceErrors.TransportAuthBundleError(
              `Failed to connect / invalid auth bundle from provided base url ${this._baseUrl}`
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
   * Request the bot to send its current configuration
   */
  public getBotConfig() {
    if (this._transport.state === "ready") {
      this._transport.sendMessage(VoiceMessage.getBotConfig());
    } else {
      throw new VoiceErrors.BotNotReadyError(
        "Attempted to get config from bot while transport not in ready state"
      );
    }
  }

  /**
   * Update pipeline and seervices
   * @param config - VoiceClientConfigOption[] partial object with the new configuration
   * @param options - Options for the update
   * @param options.useDeepMerge - Whether to use deep merge or shallow merge
   * @param options.sendPartial - Update single service config (e.g. llm or tts) or the whole config
   */
  public async updateConfig(
    config: VoiceClientConfigOption[]
  ): Promise<unknown> {
    // Only send the partial config if the bot is ready to prevent
    // potential racing conditions whilst pipeline is instantiating
    if (this._transport.state === "ready") {
      return this._messageDispatcher.dispatch(
        VoiceMessage.updateConfig(config),
        true
      );
    } else {
      this.config = config;
    }
  }

  /**
   * Request the bot to describe its current configuration
   */
  public describeConfig() {
    if (this._transport.state === "ready") {
      this._transport.sendMessage(VoiceMessage.describeConfig());
    } else {
      throw new VoiceErrors.BotNotReadyError(
        "Attempted to get config description while transport not in ready state"
      );
    }
  }

  // ------ Actions

  /**
   * Dispatch an action message to the bot
   */
  public async action(action: ActionData): Promise<unknown> {
    if (this._transport.state === "ready") {
      return this._messageDispatcher.dispatch(VoiceMessage.action(action));
    } else {
      throw new VoiceErrors.BotNotReadyError();
    }
  }

  /**
   * Describe available / registered actions the bot has
   */
  public async describeActions() {
    if (this._transport.state === "ready") {
      this._transport.sendMessage(VoiceMessage.describeActions());
    } else {
      throw new VoiceErrors.BotNotReadyError();
    }
  }

  // ------ Transport methods

  /**
   * Get the session expiry time for the transport session (if applicable)
   */
  public get transportExpiry(): number | undefined {
    if (["connected", "ready"].includes(this._transport.state)) {
      return this._transport.expiry;
    } else {
      throw new VoiceErrors.BotNotReadyError(
        "Attempted to get transport expiry time when transport not in connected or ready state"
      );
    }
  }

  // ------ Function call handler

  /**
   * If the LLM wants to call a function, RTVI will invoke the callback defined
   * here. Whatever the callback returns will be sent to the LLM as the function result.
   */

  public async handleFunctionCall(callback: FunctionCallCallback) {
    this._functionCallCallback = callback;
  }

  // ------ Message handler

  protected handleMessage(ev: VoiceMessage): void {
    if (ev instanceof VoiceMessageMetrics) {
      //@TODO: add to wrapped metrics
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
      case VoiceMessageType.CONFIG: {
        const resp = this._messageDispatcher.resolve(ev);
        this.config = (resp.data as ConfigData).config;
        break;
      }
      case VoiceMessageType.ACTION_RESPONSE: {
        this._messageDispatcher.resolve(ev);
        break;
      }
      case VoiceMessageType.ERROR_RESPONSE: {
        const resp = this._messageDispatcher.reject(ev);
        this._options.callbacks?.onMessageError?.(resp as VoiceMessage);
        break;
      }
      case VoiceMessageType.ERROR:
        this._options.callbacks?.onError?.(ev);
        break;
      case VoiceMessageType.USER_STARTED_SPEAKING:
        this._options.callbacks?.onUserStartedSpeaking?.();
        break;
      case VoiceMessageType.USER_STOPPED_SPEAKING:
        this._options.callbacks?.onUserStoppedSpeaking?.();
        break;
      case VoiceMessageType.BOT_STARTED_SPEAKING:
        this._options.callbacks?.onBotStartedSpeaking?.(ev.data as Participant);
        break;
      case VoiceMessageType.BOT_STOPPED_SPEAKING:
        this._options.callbacks?.onBotStoppedSpeaking?.(ev.data as Participant);
        break;
      case VoiceMessageType.USER_TRANSCRIPTION: {
        //@TODO add to wrapped callbacks
        const transcriptData = ev.data as Transcript;
        const transcript = transcriptData as Transcript;
        this._options.callbacks?.onUserTranscript?.(transcript);
        this.emit(VoiceEvent.UserTranscript, transcript);
        break;
      }
      case VoiceMessageType.BOT_TRANSCRIPTION: {
        //@TODO add to wrapped callbacks
        const botData = ev.data as Transcript;
        this._options.callbacks?.onBotTranscript?.(botData.text as string);
        this.emit(VoiceEvent.BotTranscript, botData.text as string);
        break;
      }
      //@TODO: move to LLM helper
      case VoiceMessageType.LLM_JSON_COMPLETION:
        this._options.callbacks?.onJsonCompletion?.(ev.data as string);
        this.emit(VoiceEvent.JSONCompletion, ev.data as string);
        break;
      case VoiceMessageType.LLM_FUNCTION_CALL: {
        const d = ev.data as LLMFunctionCallData;
        this._options.callbacks?.onLLMFunctionCall?.(
          ev.data as LLMFunctionCallData
        );
        this.emit(VoiceEvent.LLMFunctionCall, ev.data as LLMFunctionCallData);
        if (this._functionCallCallback) {
          const fn = {
            functionName: d.function_name,
            arguments: d.args,
          };
          if (this._transport.state === "ready") {
            this._functionCallCallback(fn).then((result) => {
              this._transport.sendMessage(
                VoiceMessage.llmFunctionCallResult({
                  function_name: d.function_name,
                  tool_call_id: d.tool_call_id,
                  arguments: d.args,
                  result,
                })
              );
            });
          } else {
            throw new VoiceErrors.BotNotReadyError(
              "Attempted to send a function call result from bot while transport not in ready state"
            );
          }
        }
        break;
      }
      case VoiceMessageType.LLM_FUNCTION_CALL_START: {
        const e = ev.data as LLMFunctionCallData;
        this._options.callbacks?.onLLMFunctionCallStart?.(
          e.function_name as string
        );
        this.emit(VoiceEvent.LLMFunctionCallStart, e.function_name);
        break;
      }
      default: {
        let match: boolean = false;
        // Pass message to registered helpered
        for (const helper of Object.values(
          this._helpers
        ) as VoiceClientHelper[]) {
          if (helper.getMessageTypes().includes(ev.type)) {
            match = true;
            helper.handleMessage(ev);
          }
        }
        if (!match) {
          this._options.callbacks?.onGenericMessage?.(ev.data);
        }
      }
    }
  }

  public getServiceOptionsFromConfig(service: string): unknown {
    // Check if we have registered service with name service
    if (!service) {
      throw new Error("Target service name is required");
    }
    // Find matching service name in the config and update the messages
    const configServiceKey = this.config.find(
      (config: VoiceClientConfigOption) => config.service === service
    );

    if (!configServiceKey) {
      throw new Error("No service with name " + service + " found in config");
    }

    return configServiceKey;
  }
}
