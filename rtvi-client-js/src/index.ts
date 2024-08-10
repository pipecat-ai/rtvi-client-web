import { Client, VoiceEventCallbacks } from "./core";
import { VoiceMessage } from "./messages";
import { Transport } from "./transport";

export interface VoiceClientOptions {
  /**
   * Base URL for auth handlers and transport services
   *
   * Defaults to a POST request with a the config object as the body
   */
  baseUrl: string;

  /**
   * Set transport class for media streaming
   */
  transport?: new (
    options: VoiceClientOptions,
    onMessage: (ev: VoiceMessage) => void
  ) => Transport;

  /**
   * Optional callback methods for voice events
   */
  callbacks?: VoiceEventCallbacks;

  /**
   * Service key value pairs (e.g. {llm: "openai"} )
   * A client must have at least one service to connect to a voice server
   */
  services: { [key: string]: string };

  /**
   * Service configuration options for services and further customization
   */
  config?: VoiceClientConfigOption[];

  /**
   * Handshake timeout
   *
   * How long should the client wait for the bot ready event (when authenticating / requesting an agent)
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
}

export type ConfigOption = {
  name: string;
  value: unknown;
};

export type VoiceClientConfigOption = {
  service: string;
  options: ConfigOption[];
};

export type VoiceClientLLMMessage = {
  role: string;
  content: string;
  tool_call_id?: string;
};

export type VoiceClientConfigLLM = {
  model?: string;
  messages?: VoiceClientLLMMessage[];
};

/**
 * RTVI Voice Client
 */
export class VoiceClient extends Client {
  constructor({ ...opts }: VoiceClientOptions) {
    const options: VoiceClientOptions = {
      ...opts,
      transport: opts.transport,
      services: opts.services,
      config: opts.config || [],
    };

    super(options);
  }
}

export * from "./core";
export * from "./errors";
export * from "./events";
export * from "./messages";
export * from "./transport";
