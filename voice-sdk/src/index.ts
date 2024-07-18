import { Client, VoiceEventCallbacks } from "./core";
import { DailyTransport, Transport } from "./transport";

export interface VoiceClientOptions {
  // @TODO: NOT API KEY, SOME OTEHR TOKEN INSTEAD
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

export type ConfigLLMOptions = {
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
  transport?: new (options: VoiceClientOptions) => Transport;

  /**
   * LLM service configuration options
   */
  llm?: ConfigLLMOptions;

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
  private _options: VoiceClientOptions;

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

    this._options = options;
  }

  public async start() {
    // Start session with initial config
    super.start(this._options.config!);
  }

  public get config(): VoiceClientConfigOptions {
    return this._options.config!;
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
  // public tracks() {}
  // public getServiceMetrics() {}
  // public getLatencyMetrics() {}
}

export * from "./core";
export * from "./errors";
export * from "./events";
export * from "./messages";
