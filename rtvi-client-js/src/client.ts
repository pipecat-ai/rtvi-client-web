import cloneDeep from "clone-deep";
import EventEmitter from "events";
import TypedEmitter from "typed-emitter";

import {
  dispatchAction,
  RTVIActionRequest,
  RTVIActionRequestData,
  RTVIActionResponse,
} from "./actions";
import { getIfTransportInState, transportReady } from "./decorators";
import * as RTVIErrors from "./errors";
import { RTVIEvent, RTVIEvents } from "./events";
import { RTVIClientHelper, RTVIClientHelpers } from "./helpers";
import {
  BotReadyData,
  ConfigData,
  MessageDispatcher,
  PipecatMetricsData,
  RTVIMessage,
  RTVIMessageType,
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

export type RTVIURLEndpoints = "connect" | "disconnectedAction";

const defaultEndpoints: Record<RTVIURLEndpoints, string> = {
  connect: "/connect",
  disconnectedAction: "/completion",
};

export type RTVIClientParams = {
  baseUrl: string;
} & Partial<{
  headers?: Headers;
  endpoints: Record<RTVIURLEndpoints, string>;
  bodyParams?: object;
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
  customAuthHandler?: (
    params: RTVIClientParams,
    timeout: ReturnType<typeof setTimeout> | undefined,
    abortController: AbortController
  ) => Promise<void>;

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
   * @deprecated Use params.services instead
   */
  services?: VoiceClientServices;

  /**
   * Service configuration options for services and further customization
   * @deprecated Use params.config instead
   */
  config?: VoiceClientConfigOption[];

  /**
   * Custom HTTP headers to be send with the POST request to baseUrl
   * @deprecated Use startHeaders instead
   */
  customHeaders?: { [key: string]: string };

  /**
   * Custom request parameters to send with the POST request to baseUrl
   * @deprecated Use params instead
   */
  customBodyParams?: object;
}

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
  onUserTranscriptData: (data: TranscriptData) => void;
  onBotTranscriptData: (data: TranscriptData) => void;
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
      onBotStartedSpeaking: (p) => {
        options?.callbacks?.onBotStartedSpeaking?.(p);
        this.emit(RTVIEvent.BotStartedSpeaking, p);
      },
      onBotStoppedSpeaking: (p) => {
        options?.callbacks?.onBotStoppedSpeaking?.(p);
        this.emit(RTVIEvent.BotStoppedSpeaking, p);
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
      onUserTranscriptData: (data) => {
        options?.callbacks?.onUserTranscriptData?.(data);
        this.emit(RTVIEvent.UserTranscript, data);
      },
      onBotTranscriptData: (data) => {
        options?.callbacks?.onBotTranscriptData?.(data);
        this.emit(RTVIEvent.BotTranscript, data);
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

    console.debug("[RTVI Client] Initialized");
  }

  public constructUrl(endpoint: RTVIURLEndpoints): string {
    const baseUrl = this.params.baseUrl.replace(/\/+$/, "");
    return baseUrl + (this.params.endpoints?.[endpoint] ?? "");
  }
  // ------ Transport methods

  /**
   * Initialize local media devices
   */
  public async initDevices() {
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
          this._handshakeTimeout = setTimeout(() => {
            this._abortController?.abort();
            this._transport.disconnect();
            this._transport.state = "error";
            reject(new RTVIErrors.ConnectionTimeoutError());
          }, this._options.timeout);
        }

        let authBundle: unknown;
        const customAuthHandler = this._options.customAuthHandler;
        const connectUrl = this.constructUrl("connect");

        console.debug("[RTVI Client] Connecting to baseUrl", connectUrl);
        console.debug("[RTVI Client] Start params", this.params);

        try {
          if (customAuthHandler) {
            authBundle = await customAuthHandler(
              this.params,
              this._handshakeTimeout,
              this._abortController!
            );
          } else {
            authBundle = await fetch(connectUrl, {
              method: "POST",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
                ...(this.params.headers ?? this._options.customHeaders), // @deprecated
              },
              body: JSON.stringify({
                services: this._options.services, // @deprecated
                config: this._options.config, // @deprecated
                ...this._options.customBodyParams, // @deprecated
                ...this.params.bodyParams,
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
                new RTVIErrors.StartBotError(
                  errorResp.info,
                  e.status,
                  errorResp.error
                )
              );
            }
          } catch (innerError) {
            reject(
              new RTVIErrors.StartBotError(
                `Failed to connect / invalid auth bundle from base url ${this.params.baseUrl}`
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
  public async disconnect(): Promise<void> {
    if (this._abortController) {
      this._abortController.abort();
    }

    clearTimeout(this._handshakeTimeout);

    await this._transport.disconnect();

    this._initialize();
  }

  private _initialize() {
    // Reset transport
    this._transport = this._options.transport;
    this._transport.initialize(this._options, this.handleMessage.bind(this));

    // Create a new message dispatch queue for async message handling
    this._messageDispatcher = new MessageDispatcher(this._transport);
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

  // ------ Device methods

  public async getAllMics(): Promise<MediaDeviceInfo[]> {
    return await this._transport.getAllMics();
  }

  public async getAllCams(): Promise<MediaDeviceInfo[]> {
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
    console.debug("[RTVI Client] Updating config", config);
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
   * @param config? - Optional RTVIClientConfigOption[] to update (vs. using remote config)
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
        console.debug("Target service name is required");
        return undefined;
      }

      const passedConfig: RTVIClientConfigOption[] =
        config ?? (await this.getConfig());

      // Find matching service name in the config and update the messages
      const configServiceKey = passedConfig.find(
        (config: RTVIClientConfigOption) => config.service === serviceKey
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
   * Dispatch an action message to the bot
   */
  public async action(
    action: RTVIActionRequestData
  ): Promise<RTVIActionResponse> {
    return dispatchAction.bind(this)(new RTVIActionRequest(action));
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

  protected handleMessage(ev: RTVIMessage): void {
    console.debug("[RTVI Message]", ev);

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
        this._options.callbacks?.onBotStartedSpeaking?.(ev.data as Participant);
        break;
      case RTVIMessageType.BOT_STOPPED_SPEAKING:
        this._options.callbacks?.onBotStoppedSpeaking?.(ev.data as Participant);
        break;
      case RTVIMessageType.USER_TRANSCRIPTION: {
        const TranscriptData = ev.data as TranscriptData;
        this._options.callbacks?.onUserTranscriptData?.(TranscriptData);
        break;
      }
      case RTVIMessageType.BOT_TRANSCRIPTION: {
        const TranscriptData = ev.data as TranscriptData;
        this._options.callbacks?.onBotTranscriptData?.(TranscriptData);
        break;
      }
      case RTVIMessageType.METRICS:
        this.emit(RTVIEvent.Metrics, ev.data as PipecatMetricsData);
        this._options.callbacks?.onMetrics?.(ev.data as PipecatMetricsData);
        break;
      default: {
        let match: boolean = false;
        // Pass message to registered helpered
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
    console.warn(
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
