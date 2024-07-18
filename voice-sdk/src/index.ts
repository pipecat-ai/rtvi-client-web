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
   * The starting system prompt passed to the LLM
   */
  systemPrompt?: string;

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
   * Configuration options for services and further customization
   *
   */
  config?: VoiceClientConfigOptions;

  // @@ Not yet implemented @@
  // pipeline?: Array<object>;
  // tools?: Array<object>;
  // enableCamera?: boolean;
  // startCameraMuted?: boolean;
}

export interface VoiceClientConfigOptions {
  /**
   * Override the default transport for media streaming.
   *
   * Defaults to DailyTransport
   */
  transport?: new (options: VoiceClientOptions) => Transport;

  // Not yet implemented
  idleTimeout?: number;
  idlePrompt?: string;
  llm?: object;
  tts?: object;
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

  public getOptions = (): VoiceClientOptions => {
    return this._options;
  };

  // @@ Not yet implemented @@
  // public async sendMessage() {}
  // public tracks() {}
  // public async setMicrophoneMuteState() {}
  // public getServiceMetrics() {}
  // public getLatencyMetrics() {}
}

export * from "./core";
export * from "./errors";
export * from "./events";
