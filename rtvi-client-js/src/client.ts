import cloneDeep from "clone-deep";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";

import packageJson from "../package.json";
import { getIfTransportInState, transportReady } from "./decorators";
import * as RTVIErrors from "./errors";
import { RTVIEvent, RTVIEvents } from "./events";
import { RTVIClientHelper, RTVIClientHelpers } from "./helpers";
import { logger, LogLevel } from "./logger";
import {
  BotLLMTextData,
  BotReadyData,
  BotTTSTextData,
  ConfigData,
  MessageDispatcher,
  PipecatMetricsData,
  RTVIActionRequest,
  RTVIActionRequestData,
  RTVIActionResponse,
  RTVIMessage,
  RTVIMessageType,
  StorageItemStoredData,
  TranscriptData,
} from "./messages";
import { Participant, Tracks, Transport, TransportState } from "./transport";

export type ConfigOption = {
  name: string;
  value: unknown;
};

export type RTVIClientConfigOption = {
  service: string;
  options: ConfigOption[];
};

export type RTVIURLEndpoints = "connect" | "action";

const defaultEndpoints: Record<RTVIURLEndpoints, string> = {
  connect: "/connect",
  action: "/action",
};

export type RTVIClientParams = {
  baseUrl: string;
} & Partial<{
  headers?: Headers;
  endpoints: Partial<Record<RTVIURLEndpoints, string>>;
  requestData?: object;
  config?: RTVIClientConfigOption[];
}> & {
    [key: string]: unknown;
  };

export interface RTVIClientOptions {
  /**
   * Parameters passed as JSON stringified body params to all endpoints (e.g. connect)
   */
  params: RTVIClientParams;

  /**
   * Transport class for media streaming
   */
  transport: Transport;

  /**
   * Optional callback methods for RTVI events
   */
  callbacks?: RTVIEventCallbacks;

  /**
   * Handshake timeout
   *
   * How long should the client wait for the bot ready event (when authenticating / requesting an agent)
   * Defaults to no timeout (undefined)
   */
  timeout?: number;

  /**
   * Enable user mic input
   *
   * Default to true
   */
  enableMic?: boolean;

  /**
   * Enable user cam input
   *
   * Default to false
   */
  enableCam?: boolean;

  /**
   * Custom start method handler for retrieving auth bundle for transport
   * @param baseUrl
   * @param params
   * @param timeout
   * @param abortController
   * @returns Promise<void>
   */
  customConnectHandler?: (
    params: RTVIClientParams,
    timeout: ReturnType<typeof setTimeout> | undefined,
    abortController: AbortController
  ) => Promise<AuthBundle>;

  // ----- @deprecated options

  /**
   * Base URL for auth handlers and transport services
   *
   * Defaults to a POST request with a the config object as the body
   * @deprecated Use params.baseUrl instead
   */
  baseUrl?: string;

  /**
   * Service key value pairs (e.g. {llm: "openai"} )
   * @deprecated Set on the server-side or pass services as part of
   * params.requestData
   */
  services?: VoiceClientServices;

  /**
   * Service configuration options for services and further customization
   * @deprecated Use params.config instead
   */
  config?: VoiceClientConfigOption[];

  /**
   * Custom HTTP headers to be send with the POST request to baseUrl
   * @deprecated Use headers instead
   */
  customHeaders?: { [key: string]: string };

  /**
   * Custom request parameters to send with the POST request to baseUrl
   * @deprecated Use params.requestData instead
   */
  customBodyParams?: object;
}

export type AuthBundle = {
  room_url: string;
  token: string;
};

export type RTVIEventCallbacks = Partial<{
  onGenericMessage: (data: unknown) => void;
  onMessageError: (message: RTVIMessage) => void;
  onError: (message: RTVIMessage) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onTransportStateChanged: (state: TransportState) => void;
  onConfig: (config: RTVIClientConfigOption[]) => void;
  onConfigDescribe: (configDescription: unknown) => void;
  onActionsAvailable: (actions: unknown) => void;
  onBotConnected: (participant: Participant) => void;
  onBotReady: (botReadyData: BotReadyData) => void;
  onBotDisconnected: (participant: Participant) => void;
  onParticipantJoined: (participant: Participant) => void;
  onParticipantLeft: (participant: Participant) => void;
  onMetrics: (data: PipecatMetricsData) => void;

  onAvailableCamsUpdated: (cams: MediaDeviceInfo[]) => void;
  onAvailableMicsUpdated: (mics: MediaDeviceInfo[]) => void;
  onAvailableSpeakersUpdated: (speakers: MediaDeviceInfo[]) => void;
  onCamUpdated: (cam: MediaDeviceInfo) => void;
  onMicUpdated: (mic: MediaDeviceInfo) => void;
  onSpeakerUpdated: (speaker: MediaDeviceInfo) => void;
  onTrackStarted: (track: MediaStreamTrack, participant?: Participant) => void;
  onTrackStopped: (track: MediaStreamTrack, participant?: Participant) => void;
  onLocalAudioLevel: (level: number) => void;
  onRemoteAudioLevel: (level: number, participant: Participant) => void;

  onBotStartedSpeaking: () => void;
  onBotStoppedSpeaking: () => void;
  onUserStartedSpeaking: () => void;
  onUserStoppedSpeaking: () => void;
  onUserTranscript: (data: TranscriptData) => void;
  onBotTranscript: (data: BotLLMTextData) => void;

  onBotLlmText: (data: BotLLMTextData) => void;
  onBotLlmStarted: () => void;
  onBotLlmStopped: () => void;
  onBotTtsText: (data: BotTTSTextData) => void;
  onBotTtsStarted: () => void;
  onBotTtsStopped: () => void;

  onStorageItemStored: (data: StorageItemStoredData) => void;

  /**
   * @deprecated Use onBotLlmText instead
   */
  onBotText: (data: BotLLMTextData) => void;
}>;

abstract class RTVIEventEmitter extends (EventEmitter as unknown as new () => TypedEmitter<RTVIEvents>) {}

export class RTVIClient extends RTVIEventEmitter {
  public params: RTVIClientParams;
  protected _options: RTVIClientOptions;
  private _abortController: AbortController | undefined;
  private _handshakeTimeout: ReturnType<typeof setTimeout> | undefined;
  private _helpers: RTVIClientHelpers;
  private _startResolve: ((value: unknown) => void) | undefined;
  protected _transport: Transport;
  protected _authBundle: AuthBundle | undefined;
  protected declare _messageDispatcher: MessageDispatcher;

  constructor(options: RTVIClientOptions) {
    super();

    this.params = {
      ...options.params,
      endpoints: {
        ...defaultEndpoints,
        ...(options.params.endpoints ?? {}),
      },
    };

    this._helpers = {};
    this._transport = options.transport;
    this._authBundle = undefined;

    // Wrap transport callbacks with event triggers
    // This allows for either functional callbacks or .on / .off event listeners
    const wrappedCallbacks: RTVIEventCallbacks = {
      ...options.callbacks,
      onMessageError: (message: RTVIMessage) => {
        options?.callbacks?.onMessageError?.(message);
        this.emit(RTVIEvent.MessageError, message);
      },
      onError: (message: RTVIMessage) => {
        options?.callbacks?.onError?.(message);
        this.emit(RTVIEvent.Error, message);
      },
      onConnected: () => {
        options?.callbacks?.onConnected?.();
        this.emit(RTVIEvent.Connected);
      },
      onDisconnected: () => {
        options?.callbacks?.onDisconnected?.();
        this.emit(RTVIEvent.Disconnected);
      },
      onTransportStateChanged: (state: TransportState) => {
        options?.callbacks?.onTransportStateChanged?.(state);
        this.emit(RTVIEvent.TransportStateChanged, state);
      },
      onConfig: (config: RTVIClientConfigOption[]) => {
        options?.callbacks?.onConfig?.(config);
        this.emit(RTVIEvent.Config, config);
      },
      onConfigDescribe: (configDescription: unknown) => {
        options?.callbacks?.onConfigDescribe?.(configDescription);
        this.emit(RTVIEvent.ConfigDescribe, configDescription);
      },
      onActionsAvailable: (actionsAvailable: unknown) => {
        options?.callbacks?.onActionsAvailable?.(actionsAvailable);
        this.emit(RTVIEvent.ActionsAvailable, actionsAvailable);
      },
      onParticipantJoined: (p) => {
        options?.callbacks?.onParticipantJoined?.(p);
        this.emit(RTVIEvent.ParticipantConnected, p);
      },
      onParticipantLeft: (p) => {
        options?.callbacks?.onParticipantLeft?.(p);
        this.emit(RTVIEvent.ParticipantLeft, p);
      },
      onTrackStarted: (track, p) => {
        options?.callbacks?.onTrackStarted?.(track, p);
        this.emit(RTVIEvent.TrackStarted, track, p);
      },
      onTrackStopped: (track, p) => {
        options?.callbacks?.onTrackStopped?.(track, p);
        this.emit(RTVIEvent.TrackedStopped, track, p);
      },
      onAvailableCamsUpdated: (cams) => {
        options?.callbacks?.onAvailableCamsUpdated?.(cams);
        this.emit(RTVIEvent.AvailableCamsUpdated, cams);
      },
      onAvailableMicsUpdated: (mics) => {
        options?.callbacks?.onAvailableMicsUpdated?.(mics);
        this.emit(RTVIEvent.AvailableMicsUpdated, mics);
      },
      onAvailableSpeakersUpdated: (speakers) => {
        options?.callbacks?.onAvailableSpeakersUpdated?.(speakers);
        this.emit(RTVIEvent.AvailableSpeakersUpdated, speakers);
      },
      onCamUpdated: (cam) => {
        options?.callbacks?.onCamUpdated?.(cam);
        this.emit(RTVIEvent.CamUpdated, cam);
      },
      onMicUpdated: (mic) => {
        options?.callbacks?.onMicUpdated?.(mic);
        this.emit(RTVIEvent.MicUpdated, mic);
      },
      onBotConnected: (p) => {
        options?.callbacks?.onBotConnected?.(p);
        this.emit(RTVIEvent.BotConnected, p);
      },
      onBotReady: (botReadyData: BotReadyData) => {
        options?.callbacks?.onBotReady?.(botReadyData);
        this.emit(RTVIEvent.BotReady, botReadyData);
      },
      onBotDisconnected: (p) => {
        options?.callbacks?.onBotDisconnected?.(p);
        this.emit(RTVIEvent.BotDisconnected, p);
      },
      onBotStartedSpeaking: () => {
        options?.callbacks?.onBotStartedSpeaking?.();
        this.emit(RTVIEvent.BotStartedSpeaking);
      },
      onBotStoppedSpeaking: () => {
        options?.callbacks?.onBotStoppedSpeaking?.();
        this.emit(RTVIEvent.BotStoppedSpeaking);
      },
      onRemoteAudioLevel: (level, p) => {
        options?.callbacks?.onRemoteAudioLevel?.(level, p);
        this.emit(RTVIEvent.RemoteAudioLevel, level, p);
      },
      onUserStartedSpeaking: () => {
        options?.callbacks?.onUserStartedSpeaking?.();
        this.emit(RTVIEvent.UserStartedSpeaking);
      },
      onUserStoppedSpeaking: () => {
        options?.callbacks?.onUserStoppedSpeaking?.();
        this.emit(RTVIEvent.UserStoppedSpeaking);
      },
      onLocalAudioLevel: (level) => {
        options?.callbacks?.onLocalAudioLevel?.(level);
        this.emit(RTVIEvent.LocalAudioLevel, level);
      },
      onUserTranscript: (data) => {
        options?.callbacks?.onUserTranscript?.(data);
        this.emit(RTVIEvent.UserTranscript, data);
      },
      onBotTranscript: (text) => {
        options?.callbacks?.onBotTranscript?.(text);
        this.emit(RTVIEvent.BotTranscript, text);
      },
      onBotLlmText: (text) => {
        options?.callbacks?.onBotLlmText?.(text);
        this.emit(RTVIEvent.BotLlmText, text);
      },
      onBotLlmStarted: () => {
        options?.callbacks?.onBotLlmStarted?.();
        this.emit(RTVIEvent.BotLlmStarted);
      },
      onBotLlmStopped: () => {
        options?.callbacks?.onBotLlmStopped?.();
        this.emit(RTVIEvent.BotLlmStopped);
      },
      onBotTtsText: (text) => {
        options?.callbacks?.onBotTtsText?.(text);
        this.emit(RTVIEvent.BotTtsText, text);
      },
      onBotTtsStarted: () => {
        options?.callbacks?.onBotTtsStarted?.();
        this.emit(RTVIEvent.BotTtsStarted);
      },
      onBotTtsStopped: () => {
        options?.callbacks?.onBotTtsStopped?.();
        this.emit(RTVIEvent.BotTtsStopped);
      },
      onStorageItemStored: (data) => {
        options?.callbacks?.onStorageItemStored?.(data);
        this.emit(RTVIEvent.StorageItemStored, data);
      },

      /**
       * @deprecated Use BotLlmText instead
       */
      onBotText: (text) => {
        options?.callbacks?.onBotText?.(text);
        this.emit(RTVIEvent.BotText, text);
      },
    };

    // Update options to reference wrapped callbacks and config defaults
    this._options = {
      ...options,
      callbacks: wrappedCallbacks,
      enableMic: options.enableMic ?? true,
      enableCam: options.enableCam ?? false,
    };

    // Instantiate the transport class and bind message handler
    this._initialize();

    // Get package version number
    logger.debug("[RTVI Client] Initialized", this.version);
  }

  public constructUrl(endpoint: RTVIURLEndpoints): string {
    if (!this.params.baseUrl) {
      throw new RTVIErrors.RTVIError(
        "Base URL not set. Please set rtviClient.params.baseUrl"
      );
    }
    const baseUrl = this.params.baseUrl.replace(/\/+$/, "");
    return baseUrl + (this.params.endpoints?.[endpoint] ?? "");
  }

  public setLogLevel(level: LogLevel) {
    logger.setLevel(level);
  }

  // ------ Transport methods

  /**
   * Initialize local media devices
   */
  public async initDevices() {
    logger.debug("[RTVI Client] Initializing devices...");
    await this._transport.initDevices();
  }

  /**
   * Connect the voice client session with chosen transport
   * Call async (await) to handle errors
   */
  public async connect(): Promise<unknown> {
    if (
      ["authenticating", "connecting", "connected", "ready"].includes(
        this._transport.state
      )
    ) {
      throw new RTVIErrors.RTVIError(
        "Voice client has already been started. Please call disconnect() before starting again."
      );
    }

    this._abortController = new AbortController();

    // Establish transport session and await bot ready signal
    return new Promise((resolve, reject) => {
      (async () => {
        this._startResolve = resolve;

        if (this._transport.state === "disconnected") {
          await this._transport.initDevices();
        }

        this._transport.state = "authenticating";

        // Set a timer for the bot to enter a ready state, otherwise abort the attempt
        if (this._options.timeout) {
          this._handshakeTimeout = setTimeout(async () => {
            this._abortController?.abort();
            await this.disconnect();
            this._transport.state = "error";
            reject(new RTVIErrors.ConnectionTimeoutError());
          }, this._options.timeout);
        }

        let authBundle: AuthBundle;
        const customConnectHandler = this._options.customConnectHandler;
        const connectUrl = this.constructUrl("connect");

        this.params = {
          ...this.params,
          requestData: {
            ...this.params.requestData,
            rtvi_client_version: this.version,
          },
        };

        logger.debug("[RTVI Client] Connecting...", connectUrl);
        logger.debug("[RTVI Client] Start params", this.params);

        try {
          if (customConnectHandler) {
            authBundle = await customConnectHandler(
              this.params,
              this._handshakeTimeout,
              this._abortController!
            );
          } else {
            authBundle = await fetch(connectUrl, {
              method: "POST",
              mode: "cors",
              headers: new Headers({
                "Content-Type": "application/json",
                ...Object.fromEntries(
                  (this.params.headers ?? new Headers()).entries()
                ),
              }),
              body: JSON.stringify({
                services: this._options.services, // @deprecated
                config: this.params.config ?? this._options.config, // @deprecated
                ...this._options.customBodyParams, // @deprecated
                ...this.params.requestData,
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
          // Handle errors if the request was not aborted
          if (this._abortController?.signal.aborted) {
            return;
          }
          this._transport.state = "error";
          if (e instanceof Response) {
            const errorResp = await e.json();
            reject(
              new RTVIErrors.StartBotError(
                errorResp.info ?? errorResp.detail ?? e.statusText,
                e.status
              )
            );
          } else {
            reject(new RTVIErrors.StartBotError());
          }
          return;
        }
        this._authBundle = authBundle;
        logger.debug("[RTVI Client] Auth bundle stored", this._authBundle);
        logger.debug("[RTVI Client] Auth bundle received", authBundle);

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
  public async disconnect(): Promise<void> {
    if (this._abortController) {
      this._abortController.abort();
    }

    clearTimeout(this._handshakeTimeout);
    this._authBundle = undefined;
    await this._transport.disconnect();

    this._initialize();
  }

  private _initialize() {
    // Reset transport
    this._transport = this._options.transport;
    this._transport.initialize(this._options, this.handleMessage.bind(this));

    // Create a new message dispatch queue for async message handling
    this._messageDispatcher = new MessageDispatcher(this);
  }

  /**
   * Get the current state of the transport
   */
  public get connected(): boolean {
    return ["connected", "ready"].includes(this._transport.state);
  }

  public get state(): TransportState {
    return this._transport.state;
  }

  public get version(): string {
    return packageJson.version;
  }

  public get authBundle() {
    return this._authBundle;
  }

  // ------ Device methods

  public async getAllMics(): Promise<MediaDeviceInfo[]> {
    return await this._transport.getAllMics();
  }

  public async getAllCams(): Promise<MediaDeviceInfo[]> {
    return await this._transport.getAllCams();
  }

  public async getAllSpeakers(): Promise<MediaDeviceInfo[]> {
    return await this._transport.getAllSpeakers();
  }

  public get selectedMic() {
    return this._transport.selectedMic;
  }

  public get selectedCam() {
    return this._transport.selectedCam;
  }

  public get selectedSpeaker() {
    return this._transport.selectedSpeaker;
  }

  public updateMic(micId: string) {
    this._transport.updateMic(micId);
  }

  public updateCam(camId: string) {
    this._transport.updateCam(camId);
  }

  public updateSpeaker(speakerId: string) {
    this._transport.updateSpeaker(speakerId);
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

  public tracks(): Tracks {
    return this._transport.tracks();
  }

  // ------ Config methods

  /**
   * Request the bot to send the current configuration
   * @returns Promise<RTVIClientConfigOption[]> - Promise that resolves with the bot's configuration
   */
  @transportReady
  public async getConfig(): Promise<RTVIClientConfigOption[]> {
    const configMsg = await this._messageDispatcher.dispatch(
      RTVIMessage.getBotConfig()
    );
    return (configMsg.data as ConfigData).config as RTVIClientConfigOption[];
  }

  /**
   * Update pipeline and services
   * @param config - RTVIClientConfigOption[] partial object with the new configuration
   * @param interrupt - boolean flag to interrupt the current pipeline, or wait until the next turn
   * @returns Promise<RTVIMessage> - Promise that resolves with the updated configuration
   */
  @transportReady
  public async updateConfig(
    config: RTVIClientConfigOption[],
    interrupt: boolean = false
  ): Promise<RTVIMessage> {
    logger.debug("[RTVI Client] Updating config", config);
    // Only send the partial config if the bot is ready to prevent
    // potential racing conditions whilst pipeline is instantiating
    return this._messageDispatcher.dispatch(
      RTVIMessage.updateConfig(config, interrupt)
    );
  }

  /**
   * Request bot describe the current configuration options
   * @returns Promise<unknown> - Promise that resolves with the bot's configuration description
   */
  @transportReady
  public async describeConfig(): Promise<unknown> {
    return this._messageDispatcher.dispatch(RTVIMessage.describeConfig());
  }

  /**
   * Returns configuration options for specified service key
   * @param serviceKey - Service name to get options for (e.g. "llm")
   * @param config? - Optional RTVIClientConfigOption[] to query (vs. using remote config)
   * @returns RTVIClientConfigOption | undefined - Configuration options array for the service with specified key or undefined
   */
  public async getServiceOptionsFromConfig(
    serviceKey: string,
    config?: RTVIClientConfigOption[]
  ): Promise<RTVIClientConfigOption | undefined> {
    if (!config && this.state !== "ready") {
      throw new RTVIErrors.BotNotReadyError(
        "getServiceOptionsFromConfig called without config array before bot is ready"
      );
    }

    return Promise.resolve().then(async () => {
      // Check if we have registered service with name service
      if (!serviceKey) {
        logger.debug("Target service name is required");
        return undefined;
      }

      const passedConfig: RTVIClientConfigOption[] =
        config ?? (await this.getConfig());

      // Find matching service name in the config and update the messages
      const configServiceKey = passedConfig.find(
        (config: RTVIClientConfigOption) => config.service === serviceKey
      );

      if (!configServiceKey) {
        logger.debug(
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
   * @returns Promise<unknown | undefined> - Service configuration option value or undefined
   */
  public async getServiceOptionValueFromConfig(
    serviceKey: string,
    option: string,
    config?: RTVIClientConfigOption[]
  ): Promise<unknown | undefined> {
    const configServiceKey: RTVIClientConfigOption | undefined =
      await this.getServiceOptionsFromConfig(serviceKey, config);

    if (!configServiceKey) {
      logger.debug("Service with name " + serviceKey + " not found in config");
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
   * @param config - Optional RTVIClientConfigOption[] to update (vs. using current config)
   * @returns Promise<RTVIClientConfigOption[] | undefined> - Configuration options array with updated option(s) or undefined
   */
  public async setServiceOptionInConfig(
    serviceKey: string,
    option: ConfigOption | ConfigOption[],
    config?: RTVIClientConfigOption[]
  ): Promise<RTVIClientConfigOption[] | undefined> {
    const newConfig: RTVIClientConfigOption[] = cloneDeep(
      config ?? (await this.getConfig())
    );

    const serviceOptions = await this.getServiceOptionsFromConfig(
      serviceKey,
      newConfig
    );

    if (!serviceOptions) {
      logger.debug(
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
   * Returns config object with updated properties from passed array.
   * @param configOptions - Array of RTVIClientConfigOption[] to update
   * @param config? - Optional RTVIClientConfigOption[] to update (vs. using current config)
   * @returns Promise<RTVIClientConfigOption[]> - Configuration options
   */
  public async setConfigOptions(
    configOptions: RTVIClientConfigOption[],
    config?: RTVIClientConfigOption[]
  ): Promise<RTVIClientConfigOption[]> {
    let accumulator: RTVIClientConfigOption[] = cloneDeep(
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
   * Dispatch an action message to the bot or http single-turn endpoint
   */
  public async action(
    action: RTVIActionRequestData
  ): Promise<RTVIActionResponse> {
    return this._messageDispatcher.dispatchAction(
      new RTVIActionRequest(action),
      this.handleMessage.bind(this)
    );
  }

  /**
   * Describe available / registered actions the bot has
   * @returns Promise<unknown> - Promise that resolves with the bot's actions
   */
  @transportReady
  public async describeActions(): Promise<unknown> {
    return this._messageDispatcher.dispatch(RTVIMessage.describeActions());
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
   * @param message - RTVIMessage object to send
   */
  @transportReady
  public sendMessage(message: RTVIMessage): void {
    this._transport.sendMessage(message);
  }

  /**
   * Disconnects the bot, but keeps the session alive
   */
  @transportReady
  public disconnectBot(): void {
    this._transport.sendMessage(
      new RTVIMessage(RTVIMessageType.DISCONNECT_BOT, {})
    );
  }

  protected handleMessage(ev: RTVIMessage): void {
    logger.debug("[RTVI Message]", ev);

    switch (ev.type) {
      case RTVIMessageType.BOT_READY:
        clearTimeout(this._handshakeTimeout);
        this._startResolve?.(ev.data as BotReadyData);
        this._options.callbacks?.onBotReady?.(ev.data as BotReadyData);
        break;
      case RTVIMessageType.CONFIG_AVAILABLE: {
        this._messageDispatcher.resolve(ev);
        this._options.callbacks?.onConfigDescribe?.(ev.data);
        break;
      }
      case RTVIMessageType.CONFIG: {
        const resp = this._messageDispatcher.resolve(ev);
        this._options.callbacks?.onConfig?.((resp.data as ConfigData).config);
        break;
      }
      case RTVIMessageType.ACTIONS_AVAILABLE: {
        this._messageDispatcher.resolve(ev);
        this._options.callbacks?.onActionsAvailable?.(ev.data);
        break;
      }
      case RTVIMessageType.ACTION_RESPONSE: {
        this._messageDispatcher.resolve(ev);
        break;
      }
      case RTVIMessageType.ERROR_RESPONSE: {
        const resp = this._messageDispatcher.reject(ev);
        this._options.callbacks?.onMessageError?.(resp as RTVIMessage);
        break;
      }
      case RTVIMessageType.ERROR:
        this._options.callbacks?.onError?.(ev);
        break;
      case RTVIMessageType.USER_STARTED_SPEAKING:
        this._options.callbacks?.onUserStartedSpeaking?.();
        break;
      case RTVIMessageType.USER_STOPPED_SPEAKING:
        this._options.callbacks?.onUserStoppedSpeaking?.();
        break;
      case RTVIMessageType.BOT_STARTED_SPEAKING:
        this._options.callbacks?.onBotStartedSpeaking?.();
        break;
      case RTVIMessageType.BOT_STOPPED_SPEAKING:
        this._options.callbacks?.onBotStoppedSpeaking?.();
        break;
      case RTVIMessageType.USER_TRANSCRIPTION: {
        const TranscriptData = ev.data as TranscriptData;
        this._options.callbacks?.onUserTranscript?.(TranscriptData);
        break;
      }
      case RTVIMessageType.BOT_TRANSCRIPTION: {
        this._options.callbacks?.onBotTranscript?.(ev.data as BotLLMTextData);
        break;
      }
      case RTVIMessageType.BOT_LLM_TEXT:
        this._options.callbacks?.onBotLlmText?.(ev.data as BotLLMTextData);
        this._options.callbacks?.onBotText?.(ev.data as BotLLMTextData); // @deprecated
        break;
      case RTVIMessageType.BOT_LLM_STARTED:
        this._options.callbacks?.onBotLlmStarted?.();
        break;
      case RTVIMessageType.BOT_LLM_STOPPED:
        this._options.callbacks?.onBotLlmStopped?.();
        break;
      case RTVIMessageType.BOT_TTS_TEXT:
        this._options.callbacks?.onBotTtsText?.(ev.data as BotTTSTextData);
        break;
      case RTVIMessageType.BOT_TTS_STARTED:
        this._options.callbacks?.onBotTtsStarted?.();
        break;
      case RTVIMessageType.BOT_TTS_STOPPED:
        this._options.callbacks?.onBotTtsStopped?.();
        break;
      case RTVIMessageType.METRICS:
        this.emit(RTVIEvent.Metrics, ev.data as PipecatMetricsData);
        this._options.callbacks?.onMetrics?.(ev.data as PipecatMetricsData);
        break;
      case RTVIMessageType.STORAGE_ITEM_STORED:
        this._options.callbacks?.onStorageItemStored?.(
          ev.data as StorageItemStoredData
        );
        break;
      default: {
        let match: boolean = false;
        // Pass message to registered helpers
        for (const helper of Object.values(
          this._helpers
        ) as RTVIClientHelper[]) {
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

  // ------ Helpers

  /**
   * Register a new helper to the client
   * This (optionally) provides a way to reference helpers directly
   * from the client and use the event dispatcher
   * @param service - Target service for this helper
   * @param helper - Helper instance
   * @returns RTVIClientHelper - Registered helper instance
   */
  public registerHelper(
    service: string,
    helper: RTVIClientHelper
  ): RTVIClientHelper {
    if (this._helpers[service]) {
      throw new Error(`Helper with name '${service}' already registered`);
    }

    // Check helper is instance of RTVIClientHelper
    if (!(helper instanceof RTVIClientHelper)) {
      throw new Error(`Helper must be an instance of RTVIClientHelper`);
    }

    helper.service = service;
    helper.client = this;

    this._helpers[service] = helper;

    return this._helpers[service];
  }

  public getHelper<T extends RTVIClientHelper>(service: string): T | undefined {
    const helper = this._helpers[service];
    if (!helper) {
      logger.debug(`Helper targeting service '${service}' not found`);
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

  // ------ Deprecated

  /**
   * @deprecated use connect() instead
   */
  public async start(): Promise<unknown> {
    return this.connect();
  }

  /**
   * @deprecated use getConfig instead
   * @returns Promise<RTVIClientConfigOption[]> - Promise that resolves with the bot's configuration
   */
  @transportReady
  public async getBotConfig(): Promise<RTVIClientConfigOption[]> {
    logger.warn(
      "VoiceClient.getBotConfig is deprecated. Use getConfig instead."
    );
    return this.getConfig();
  }

  /**
   * @deprecated This getter is deprecated and will be removed in future versions. Use getConfig instead.
   * Current client configuration
   * For the most up-to-date configuration, use getBotConfig method
   * @returns RTVIClientConfigOption[] - Array of configuration options
   */
  public get config(): RTVIClientConfigOption[] {
    logger.warn("VoiceClient.config is deprecated. Use getConfig instead.");
    return this._options.config!;
  }

  /**
   * Get registered services from voice client constructor options
   * @deprecated Services not accessible via the client instance
   */
  public get services(): VoiceClientServices {
    logger.warn("VoiceClient.services is deprecated.");
    return this._options.services!;
  }

  /**
   * @deprecated Services not accessible via the client instance
   */
  public set services(services: VoiceClientServices) {
    logger.warn("VoiceClient.services is deprecated.");
    if (
      !["authenticating", "connecting", "connected", "ready"].includes(
        this._transport.state
      )
    ) {
      this._options.services = services;
    } else {
      throw new RTVIErrors.RTVIError(
        "Cannot set services while transport is connected"
      );
    }
  }
}

// ----- Deprecated types

/**
 * @deprecated Use RTVIClientConfigOption.
 */
export type VoiceClientConfigOption = RTVIClientConfigOption;

/**
 * @deprecated No longer used.
 */
export type VoiceClientServices = { [key: string]: string };
