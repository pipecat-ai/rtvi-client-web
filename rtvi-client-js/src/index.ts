import { Client, VoiceEventCallbacks } from "./core";
import { VoiceMessage } from "./messages";
import { DailyTransport, Transport } from "./transport";

export interface VoiceClientOptions {
  /**
   * Base URL for auth handlers and transport services
   *
   * Defaults to a POST request with a the config object as the body
   */
  baseUrl: string;

  /**
   * Override the default transport for media streaming.
   *
   * Defaults to DailyTransport
   */
  transport?: new (
    options: VoiceClientOptions,
    onMessage: (ev: VoiceMessage) => void
  ) => Transport;

  /**
   * Use a custom domain with your transport service
   */
  transportURL?: string;

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
   * Join the session with the user's mic muted
   *
   * Default to false
   */
  startMicMuted?: boolean;

  /**
   * Optional callback methods for voice events
   */
  callbacks?: VoiceEventCallbacks;

  /**
   * Service configuration options for services and further customization
   *
   */
  config?: VoiceClientConfigOptions;

  // @@ Not yet implemented @@
  // pipeline?: Array<object>;
  // tools?: Array<object>;
  // startCameraMuted?: boolean;
}

export type VoiceClientLLMMessage = {
  role: string;
  content: string;
};

export type VoiceClientConfigLLM = {
  model?: string;
  messages?: VoiceClientLLMMessage[];
};

export type ConfigTTSOptions = {
  voice?: string;
};

export interface VoiceClientConfigOptions {
  /**
   * LLM service configuration options
   */
  llm?: VoiceClientConfigLLM;
  tts?: ConfigTTSOptions;

  // Not yet implemented
  idleTimeout?: number;
  idlePrompt?: string;
  stt?: object;
}

/**
 * RTVI Voice Client
 */
export class VoiceClient extends Client {
  constructor(
    { ...opts }: VoiceClientOptions = {
      baseUrl: "https://rtvi.pipecat.bot",
    }
  ) {
    // Validate client options
    const options: VoiceClientOptions = {
      ...opts,
      transport: opts.transport || DailyTransport,
      config: {
        ...opts.config,
      },
    };

    super(options);
  }
}

export * from "./core";
export * from "./errors";
export * from "./events";
export * from "./messages";
export type { TransportState } from "./transport";
