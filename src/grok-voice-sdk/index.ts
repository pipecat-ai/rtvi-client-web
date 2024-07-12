import * as API from "./core";
import * as Errors from "./error";
import * as Events from "./events";
import { DailyTransport, Transport } from "./transport";

export interface VoiceClientOptions {
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
  callbacks?: API.VoiceEventCallbacks;

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
  transport?: new () => Transport;

  // Not yet implemented
  idleTimeout?: number;
  idlePrompt?: string;
  llm?: object;
  tts?: object;
}

/**
 * API Client for interfacing with the Groq API.
 */
export class VoiceClient extends API.Client {
  private _options: VoiceClientOptions;

  constructor({ ...opts }: VoiceClientOptions = {}) {
    // Validate client options
    const options: VoiceClientOptions = {
      ...opts,
      config: {
        ...opts.config,
        transport: opts.config?.transport || DailyTransport,
      },
    };

    super({
      baseUrl: options.baseUrl,
      callbacks: options.callbacks!,
      transport: options.config!.transport!,
    });

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

export const { GroqVoiceError } = Errors;
export const { VoiceEvent } = Events;
