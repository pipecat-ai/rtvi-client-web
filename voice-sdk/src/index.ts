import { Client, VoiceEventCallbacks } from "./core";
import { VoiceMessage } from "./messages";
import { DailyTransport, Transport } from "./transport";

export interface VoiceClientOptions {
  // @TODO: Remove. This is just for the developer preview
  apiKey: string;

  /**
   * Base URL for the transport service
   */
  baseUrl?: string;

  /**
   * Enable user mic input
   *
   * Default to true
   */
  enableMic?: boolean;

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
  // enableCamera?: boolean;
  // startCameraMuted?: boolean;
}

export type VoiceClientConfigLLM = {
  model?: string;
  messages?: Array<{
    role: string;
    content: string;
  }>;
};

export type ConfigTTSOptions = {
  voice?: string;
};

export interface VoiceClientConfigOptions {
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
   * LLM service configuration options
   */
  llm?: VoiceClientConfigLLM;

  // Not yet implemented
  idleTimeout?: number;
  idlePrompt?: string;
  tts?: object;
  stt?: object;
}

/**
 * API Client for interfacing with the Groq API.
 */
export class VoiceClient extends Client {
  constructor({ ...opts }: VoiceClientOptions = { apiKey: "" }) {
    // Validate client options
    const options: VoiceClientOptions = {
      ...opts,
      config: {
        ...opts.config,
        transport: opts.config?.transport || DailyTransport,
      },
    };

    super(options);
  }

  public updateConfig(
    config: VoiceClientConfigOptions
  ): VoiceClientConfigOptions {
    super.handleConfigUpdate(config);

    this._options = {
      ...this._options,
      config: { ...this._options.config, ...config },
    };

    return config;
  }

  // @@ Not yet implemented @@
  // public async sendMessage() {}
  // public getServiceMetrics() {}
  // public getLatencyMetrics() {}
}

export * from "./core";
export * from "./errors";
export * from "./events";
export * from "./messages";
