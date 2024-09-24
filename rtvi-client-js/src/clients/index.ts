import EventEmitter from "events";
import TypedEmitter from "typed-emitter";

import { RTVIActionRequestData } from "../actions";
import { RTVIEvents } from "../events";
import { RTVIClientHelper } from "../helpers";
import {
  BotReadyData,
  MessageDispatcher,
  PipecatMetricsData,
  RTVIMessage,
  RTVIMessageActionResponse,
} from "../messages";
import { Participant, Transport, TransportState } from "../transport";

export type RTVIBaseEventCallbacks = Partial<{
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
}>;

export interface RTVIBaseClientOptions {
  /**
   * Parameters passed as JSON stringified body params to the baseUrl
   */
  params: RTVIClientParams;

  /**
   * Optional callback methods for rtvi events
   */
  callbacks?: RTVIBaseEventCallbacks;

  /**
   * Set transport class for media streaming
   */
  transport?: new (
    options: RTVIBaseClientOptions,
    onMessage: (ev: RTVIMessage) => void
  ) => Transport;

  /**
   * Handshake timeout
   *
   * How long should the client wait for the bot ready event (when authenticating / requesting an agent)
   * Defaults to no timeout (undefined)
   */
  timeout?: number;

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

  // ----- deprecated options

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

export type ConfigOption = {
  name: string;
  value: unknown;
};

export type RTVIClientConfigOption = {
  service: string;
  options: ConfigOption[];
};

export type RTVIClientParams = {
  baseUrl: URL | string;
} & Partial<{
  headers?: Headers;
  config?: RTVIClientConfigOption[];
}> & {
    [key: string]: unknown;
  };

// ----- Abstract base client

export abstract class RTVIClientBase extends (EventEmitter as unknown as new () => TypedEmitter<RTVIEvents>) {
  abstract params: RTVIClientParams;
  protected abstract _transport: Transport;
  protected abstract _messageDispatcher: MessageDispatcher;

  abstract get connected(): boolean;
  abstract connect(): Promise<unknown>;
  abstract disconnect(): Promise<void>;

  abstract get state(): TransportState;
  abstract getConfig(): Promise<RTVIClientConfigOption[]>;
  abstract updateConfig(
    config: RTVIClientConfigOption[],
    interrupt?: boolean
  ): Promise<RTVIMessage>;
  abstract describeConfig(): Promise<unknown>;

  abstract getServiceOptionsFromConfig(
    serviceKey: string,
    config?: RTVIClientConfigOption[]
  ): Promise<RTVIClientConfigOption | undefined>;
  abstract getServiceOptionValueFromConfig(
    serviceKey: string,
    option: string,
    config?: RTVIClientConfigOption[]
  ): Promise<unknown | undefined>;
  abstract setServiceOptionInConfig(
    serviceKey: string,
    option: ConfigOption | ConfigOption[],
    config?: RTVIClientConfigOption[]
  ): Promise<RTVIClientConfigOption[] | undefined>;
  abstract setConfigOptions(
    configOptions: RTVIClientConfigOption[],
    config?: RTVIClientConfigOption[]
  ): Promise<RTVIClientConfigOption[]>;

  abstract action(
    action: RTVIActionRequestData
  ): Promise<RTVIMessageActionResponse>;
  abstract describeActions(): Promise<unknown>;
  abstract sendMessage(message: RTVIMessage): void;
  protected abstract handleMessage(ev: RTVIMessage): void;

  abstract registerHelper(
    service: string,
    helper: RTVIClientHelper
  ): RTVIClientHelper;
  abstract getHelper<T extends RTVIClientHelper>(
    service: string
  ): T | undefined;
  abstract unregisterHelper(service: string): void;

  // ----- Deprecated methods
  /**
   * @deprecated Use connect().
   */
  abstract start(): Promise<unknown>;
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

// ----- Exports

export * from "./core";
