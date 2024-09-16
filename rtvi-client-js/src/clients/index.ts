import { BotReadyData, PipecatMetrics, RTVIMessage } from "../messages";
import { Participant, TransportState } from "../transport";

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
  onMetrics: (data: PipecatMetrics) => void;
}>;

export interface RTVIClientOptions {
  /**
   * Base URL for auth handlers and transport services
   *
   * Defaults to a POST request with a the config object as the body
   */
  baseUrl: string;

  /**
   * Parameters passed as JSON stringified body params to the baseUrl
   */
  startParams?: Partial<{
    config?: RTVIClientConfigOption[];
  }>;

  /**
   * HTTP headers to be send with the POST request to baseUrl
   */
  startHeaders?: { [key: string]: string };

  /**
   * Optional callback methods for rtvi events
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
   * Custom start method handler for retrieving auth bundle for transport
   * @param baseUrl
   * @param startParams
   * @param timeout
   * @param abortController
   * @returns Promise<void>
   */
  customAuthHandler?: (
    baseUrl: string,
    startParams: object,
    timeout: ReturnType<typeof setTimeout> | undefined,
    abortController: AbortController
  ) => Promise<void>;

  // ----- deprecated options

  /**
   * Service key value pairs (e.g. {llm: "openai"} )
   * @deprecated Use startParams.services instead
   */
  services?: VoiceClientServices;

  /**
   * Service configuration options for services and further customization
   * @deprecated Use startParams.config instead
   */
  config?: VoiceClientConfigOption[];

  /**
   * Custom HTTP headers to be send with the POST request to baseUrl
   * @deprecated Use startHeaders instead
   */
  customHeaders?: { [key: string]: string };

  /**
   * Custom request parameters to send with the POST request to baseUrl
   * @deprecated Use startParams instead
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

// ----- Deprecated types

// @deprecated - use RTVIClientConfigOption
export type VoiceClientConfigOption = RTVIClientConfigOption;

// @deprecated - no longer used
export type VoiceClientServices = { [key: string]: string };

// ----- Exports

export * from "./voice";
