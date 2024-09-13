import cloneDeep from "clone-deep";
import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";

import type { ActionData } from "./messages";
import {
  BotReadyData,
  ConfigData,
  ConfigOption,
  MessageDispatcher,
  PipecatMetrics,
  Transcript,
  VoiceClientConfigOption,
  VoiceClientHelper,
  VoiceClientHelpers,
  VoiceClientOptions,
  VoiceClientServices,
  VoiceMessage,
  VoiceMessageActionResponse,
  VoiceMessageMetrics,
  VoiceMessageType,
} from ".";

import * as VoiceErrors from "./errors";
import { VoiceEvent, VoiceEvents } from "./events";
import { Participant, Transport, TransportState } from "./transport";
import { getIfTransportInState, transportReady } from "./decorators";

export type VoiceEventCallbacks = Partial<{
  onGenericMessage: (data: unknown) => void;
  onMessageError: (message: VoiceMessage) => void;
  onError: (message: VoiceMessage) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onTransportStateChanged: (state: TransportState) => void;

  onConfig: (config: VoiceClientConfigOption[]) => void;
  onConfigDescribe: (configDescription: unknown) => void;
  onActionsAvailable: (actions: unknown) => void;
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
  private _messageDispatcher: MessageDispatcher;
  private readonly _baseUrl: string;
  private _startResolve: ((value: unknown) => void) | undefined;
  private _abortController: AbortController | undefined;
  private _handshakeTimeout: ReturnType<typeof setTimeout> | undefined;
  private _helpers: VoiceClientHelpers;

  constructor(options: VoiceClientOptions) {
    super();

    this._baseUrl = options.baseUrl;
    this._helpers = {};

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
      onConfig: (config: VoiceClientConfigOption[]) => {
        options?.callbacks?.onConfig?.(config);
        this.emit(VoiceEvent.Config, config);
      },
      onConfigDescribe: (configDescription: unknown) => {
        options?.callbacks?.onConfigDescribe?.(configDescription);
        this.emit(VoiceEvent.ConfigDescribe, configDescription);
      },
      onActionsAvailable: (actionsAvailable: unknown) => {
        options?.callbacks?.onActionsAvailable?.(actionsAvailable);
        this.emit(VoiceEvent.ActionsAvailable, actionsAvailable);
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
      onUserTranscript: (data) => {
        options?.callbacks?.onUserTranscript?.(data);
        this.emit(VoiceEvent.UserTranscript, data);
      },
    };

    // Update options to reference wrapped callbacks
    this._options = {
      ...options,
      callbacks: wrappedCallbacks,
    };

    // Instantiate the transport class
    const cls = this._options.transport!;
    this._transport = new cls(this._options, this.handleMessage.bind(this))!;

    // Create a new message dispatch queue for async message handling
    this._messageDispatcher = new MessageDispatcher(this._transport);

    console.debug("[RTVI Client] Initialized");
  }

  // ------ Helpers

  /**
   * Register a new helper to the client
   * This (optionally) provides a way to reference the helper directly
   * from the client and use the event dispatcher
   * @param service - Target service for this helper
   * @param helper - Helper instance
   */
  public registerHelper(
    service: string,
    helper: VoiceClientHelper
  ): VoiceClientHelper {
    if (this._helpers[service]) {
      throw new Error(`Helper with name '${service}' already registered`);
    }

    // Check helper is instance of VoiceClientHelper
    if (!(helper instanceof VoiceClientHelper)) {
      throw new Error(`Helper must be an instance of VoiceClientHelper`);
    }

    helper.service = service;
    helper.voiceClient = this;

    this._helpers[service] = helper;

    return this._helpers[service];
  }

  public getHelper<T extends VoiceClientHelper>(
    service: string
  ): T | undefined {
    const helper = this._helpers[service];
    if (!helper) {
      console.debug(`Helper targeting service '${service}' not found`);
      return undefined;
    }
    return helper as T;
  }

  public unregisterHelper(service: string) {
    if (!this._helpers[service]) {
      return;
    }
    delete this._helpers[service];
  }

  // ------ Transport methods

  /**
   * Initialize the local media devices
   */
  public async initDevices() {
    await this._transport.initDevices();
  }

  /**
   * Start the voice client session with chosen transport
   * Call async (await) to handle errors
   */
  public async start() {
    if (
      ["authenticating", "connecting", "connected", "ready"].includes(
        this._transport.state
      )
    ) {
      throw new VoiceErrors.VoiceError(
        "Voice client has already been started. Please call disconnect() before starting again."
      );
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

        // Set a timer for the bot to enter a ready state, otherwise abort the attempt
        if (this._options.timeout) {
          this._handshakeTimeout = setTimeout(() => {
            this._abortController?.abort();
            this._transport.disconnect();
            this._transport.state = "error";
            reject(new VoiceErrors.ConnectionTimeoutError());
          }, this._options.timeout);
        }

        let authBundle: unknown;
        const customAuthHandler = this._options.customAuthHandler;

        console.debug("[RTVI Client] Connecting to baseUrl", this._baseUrl);
        console.debug("[RTVI Client] Start params", this._options.startParams);

        try {
          if (customAuthHandler) {
            authBundle = await customAuthHandler(
              this._baseUrl,
              this._handshakeTimeout,
              this._abortController!
            );
          } else {
            authBundle = await fetch(`${this._baseUrl}`, {
              method: "POST",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
                ...this._options.customHeaders,
              },
              body: JSON.stringify({
                services: this._options.services, // @deprecated
                config: this._options.config!, // @deprecated
                ...this._options.customBodyParams, // @deprecated
                ...this._options.startParams,
              }),
              signal: this._abortController?.signal,
            }).then((res) => {
              clearTimeout(this._handshakeTimeout);

              if (res.ok) {
                return res.json();
              }
              return Promise.reject(res);
            });
          }
        } catch (e) {
          clearTimeout(this._handshakeTimeout);
          this._transport.state = "error";
          try {
            if (e instanceof Response) {
              const errorResp = await e.json();
              reject(
                new VoiceErrors.StartBotError(
                  errorResp.info,
                  e.status,
                  errorResp.error
                )
              );
            }
          } catch (innerError) {
            reject(
              new VoiceErrors.StartBotError(
                `Failed to connect / invalid auth bundle from base url ${this._baseUrl}`
              )
            );
            return;
          }
        }

        console.debug("[RTVI Client] Auth bundle received", authBundle);

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

        await this._transport.sendReadyMessage();
      })();
    });
  }

  /**
   * Disconnect the voice client from the transport
   * Reset / reinitialize transport and abort any pending requests
   */
  public async disconnect() {
    if (this._abortController) {
      this._abortController.abort();
    }

    clearTimeout(this._handshakeTimeout);

    await this._transport.disconnect();

    this._reset();
  }

  private _reset() {
    this._transport = new this._options.transport!(
      this._options,
      this.handleMessage.bind(this)
    )!;

    // Create a new message dispatch queue for async message handling
    this._messageDispatcher = new MessageDispatcher(this._transport);
  }

  /**
   * Get the current state of the transport
   */
  public get state(): TransportState {
    return this._transport.state;
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

  /**
   * Request the bot to send the current configuration
   * @returns Promise<VoiceClientConfigOption[]> - Promise that resolves with the bot's configuration
   */
  @transportReady
  public async getConfig(): Promise<VoiceClientConfigOption[]> {
    const configMsg = await this._messageDispatcher.dispatch(
      VoiceMessage.getBotConfig()
    );
    return (configMsg.data as ConfigData).config as VoiceClientConfigOption[];
  }

  /**
   * Update pipeline and services
   * @param config - VoiceClientConfigOption[] partial object with the new configuration
   * @param interrupt - boolean flag to interrupt the current pipeline, or wait until the next turn
   * @returns Promise<unknown> - Promise that resolves with the updated configuration
   */
  @transportReady
  public async updateConfig(
    config: VoiceClientConfigOption[],
    interrupt: boolean = false
  ): Promise<VoiceMessage> {
    console.debug("[RTVI Client] Updating config", config);
    // Only send the partial config if the bot is ready to prevent
    // potential racing conditions whilst pipeline is instantiating
    return this._messageDispatcher.dispatch(
      VoiceMessage.updateConfig(config, interrupt)
    );
  }

  /**
   * Request bot describe the current configuration options
   * @returns Promise<unknown> - Promise that resolves with the bot's configuration description
   */
  @transportReady
  public async describeConfig(): Promise<unknown> {
    return this._messageDispatcher.dispatch(VoiceMessage.describeConfig());
  }

  /**
   * Returns configuration options for specified service key
   * @param serviceKey - Service name to get options for (e.g. "llm")
   * @param config? - Optional VoiceClientConfigOption[] to update (vs. using remote config)
   * @returns VoiceClientConfigOption | undefined - Configuration options array for the service with specified key or undefined
   */
  public async getServiceOptionsFromConfig(
    serviceKey: string,
    config?: VoiceClientConfigOption[]
  ): Promise<VoiceClientConfigOption | undefined> {
    if (!config && this.state !== "ready") {
      throw new VoiceErrors.BotNotReadyError(
        "getServiceOptionsFromConfig called without config array before bot is ready"
      );
    }

    return Promise.resolve().then(async () => {
      // Check if we have registered service with name service
      if (!serviceKey) {
        console.debug("Target service name is required");
        return undefined;
      }

      const passedConfig: VoiceClientConfigOption[] =
        config ?? (await this.getConfig());

      // Find matching service name in the config and update the messages
      const configServiceKey = passedConfig.find(
        (config: VoiceClientConfigOption) => config.service === serviceKey
      );

      if (!configServiceKey) {
        console.debug(
          "No service with name " + serviceKey + " not found in config"
        );
        return undefined;
      }

      // Return a new object, as to not mutate existing state
      return configServiceKey;
    });
  }

  /**
   * Returns configuration option value (unknown) for specified service key and option name
   * @param serviceKey - Service name to get options for (e.g. "llm")
   * @optional option Name of option return from the config (e.g. "model")
   * @returns unknown | undefined - Service configuration option value or undefined
   */
  public async getServiceOptionValueFromConfig(
    serviceKey: string,
    option: string,
    config?: VoiceClientConfigOption[]
  ): Promise<unknown | undefined> {
    const configServiceKey: VoiceClientConfigOption | undefined =
      await this.getServiceOptionsFromConfig(serviceKey, config);

    if (!configServiceKey) {
      console.debug("Service with name " + serviceKey + " not found in config");
      return undefined;
    }

    // Find matching option key in the service config
    const optionValue: ConfigOption | undefined = configServiceKey.options.find(
      (o: ConfigOption) => o.name === option
    );

    return optionValue ? (optionValue as ConfigOption).value : undefined;
  }

  private _updateOrAddOption(
    existingOptions: ConfigOption[],
    newOption: ConfigOption
  ): ConfigOption[] {
    const existingOptionIndex = existingOptions.findIndex(
      (item) => item.name === newOption.name
    );
    if (existingOptionIndex !== -1) {
      // Update existing option
      return existingOptions.map((item, index) =>
        index === existingOptionIndex
          ? { ...item, value: newOption.value }
          : item
      );
    } else {
      // Add new option
      return [
        ...existingOptions,
        { name: newOption.name, value: newOption.value },
      ];
    }
  }

  /**
   * Returns config with updated option(s) for specified service key and option name
   * Note: does not update current config, only returns a new object (call updateConfig to apply changes)
   * @param serviceKey - Service name to get options for (e.g. "llm")
   * @param option - Service name to get options for (e.g. "model")
   * @param config - Optional VoiceClientConfigOption[] to update (vs. using current config)
   * @returns VoiceClientConfigOption[] - Configuration options
   */
  public async setServiceOptionInConfig(
    serviceKey: string,
    option: ConfigOption | ConfigOption[],
    config?: VoiceClientConfigOption[]
  ): Promise<VoiceClientConfigOption[] | undefined> {
    const newConfig: VoiceClientConfigOption[] = cloneDeep(
      config ?? (await this.getConfig())
    );

    const serviceOptions = await this.getServiceOptionsFromConfig(
      serviceKey,
      newConfig
    );

    if (!serviceOptions) {
      console.debug(
        "Service with name '" + serviceKey + "' not found in config"
      );
      return newConfig;
    }

    const optionsArray = Array.isArray(option) ? option : [option];

    for (const opt of optionsArray) {
      const existingItem = newConfig.find(
        (item) => item.service === serviceKey
      );
      const updatedOptions = existingItem
        ? this._updateOrAddOption(existingItem.options, opt)
        : [{ name: opt.name, value: opt.value }];

      if (existingItem) {
        existingItem.options = updatedOptions;
      } else {
        newConfig.push({ service: serviceKey, options: updatedOptions });
      }
    }

    return newConfig;
  }

  /**
   * Returns config object with update properties from passed array
   * @param configOptions - Array of VoiceClientConfigOption[] to update
   * @param config? - Optional VoiceClientConfigOption[] to update (vs. using current config)
   * @returns VoiceClientConfigOption[] - Configuration options
   */
  public async setConfigOptions(
    configOptions: VoiceClientConfigOption[],
    config?: VoiceClientConfigOption[]
  ): Promise<VoiceClientConfigOption[]> {
    let accumulator: VoiceClientConfigOption[] = cloneDeep(
      config ?? (await this.getConfig())
    );

    for (const configOption of configOptions) {
      accumulator =
        (await this.setServiceOptionInConfig(
          configOption.service,
          configOption.options,
          accumulator
        )) || accumulator;
    }
    return accumulator;
  }

  // ------ Actions

  /**
   * Dispatch an action message to the bot
   * @param actionData - ActionData object with the action to dispatch
   * @returns Promise<VoiceMessageActionResponse> - Promise that resolves with the action response
   */
  @transportReady
  public async action(
    actionData: ActionData
  ): Promise<VoiceMessageActionResponse> {
    return this._messageDispatcher.dispatch(
      VoiceMessage.action(actionData)
    ) as Promise<VoiceMessageActionResponse>;
  }

  /**
   * Describe available / registered actions the bot has
   * @returns Promise<unknown> - Promise that resolves with the bot's actions
   */
  @transportReady
  public async describeActions(): Promise<unknown> {
    return this._messageDispatcher.dispatch(VoiceMessage.describeActions());
  }

  // ------ Transport methods

  /**
   * Get the session expiry time for the transport session (if applicable)
   * @returns number - Expiry time in milliseconds
   */
  @getIfTransportInState("connected", "ready")
  public get transportExpiry(): number | undefined {
    return this._transport.expiry;
  }

  // ------ Messages

  /**
   * Directly send a message to the bot via the transport
   * @param message - VoiceMessage object to send
   */
  @transportReady
  public sendMessage(message: VoiceMessage): void {
    this._transport.sendMessage(message);
  }

  protected handleMessage(ev: VoiceMessage): void {
    console.debug("[Voice Message]", ev);

    if (ev instanceof VoiceMessageMetrics) {
      //@TODO: add to wrapped metrics
      this.emit(VoiceEvent.Metrics, ev.data as PipecatMetrics);
      return this._options.callbacks?.onMetrics?.(ev.data as PipecatMetrics);
    }

    switch (ev.type) {
      case VoiceMessageType.BOT_READY:
        clearTimeout(this._handshakeTimeout);
        // Hydrate config with the bot's config
        this._options.config = (ev.data as BotReadyData).config;
        this._transport.state = "ready";
        this._startResolve?.(ev.data as BotReadyData);
        this._options.callbacks?.onBotReady?.(ev.data as BotReadyData);
        break;
      case VoiceMessageType.CONFIG_AVAILABLE: {
        this._messageDispatcher.resolve(ev);
        this._options.callbacks?.onConfigDescribe?.(ev.data);
        break;
      }
      case VoiceMessageType.CONFIG: {
        const resp = this._messageDispatcher.resolve(ev);
        this._options.callbacks?.onConfig?.((resp.data as ConfigData).config);
        break;
      }
      case VoiceMessageType.ACTIONS_AVAILABLE: {
        this._messageDispatcher.resolve(ev);
        this._options.callbacks?.onActionsAvailable?.(ev.data);
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

  // ------ Deprecated

  /**
   * @deprecated use getConfig instead
   * @returns Promise<unknown> - Promise that resolves with the bot's configuration
   */
  @transportReady
  public async getBotConfig(): Promise<VoiceClientConfigOption[]> {
    console.warn(
      "VoiceClient.getBotConfig is deprecated. Use getConfig instead."
    );
    return this.getConfig();
  }

  /**
   * @deprecated This getter is deprecated and will be removed in future versions. Use getConfig instead.
   * Current client configuration
   * For the most up-to-date configuration, use getBotConfig method
   * @returns VoiceClientConfigOption[] - Array of configuration options
   */
  public get config(): VoiceClientConfigOption[] {
    console.warn("VoiceClient.config is deprecated. Use getConfig instead.");
    return this._options.config!;
  }

  /**
   * Get registered services from voice client constructor options
   * @deprecated Services not accessible via the client instance
   */
  public get services(): VoiceClientServices {
    console.warn("VoiceClient.services is deprecated.");
    return this._options.services!;
  }

  /**
   * @deprecated Services not accessible via the client instance
   */
  public set services(services: VoiceClientServices) {
    console.warn("VoiceClient.services is deprecated.");
    if (
      !["authenticating", "connecting", "connected", "ready"].includes(
        this._transport.state
      )
    ) {
      this._options.services = services;
    } else {
      throw new VoiceErrors.VoiceError(
        "Cannot set services while transport is connected"
      );
    }
  }
}
