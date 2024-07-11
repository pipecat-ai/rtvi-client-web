import * as Errors from "./error";
import * as Events from "./events";
import { Transport } from "./transport";
import { DailyTransport } from "./transport";
import { APIClient } from "./core";

export interface VoiceClientOptions {
  /**
   * The starting system prompt passed to the LLM
   */
  systemPrompt?: string | undefined;

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
   * Override the default transport for media streaming.
   *
   * Defaults to DailyTransport
   */
  transport?: new () => Transport | undefined;
}

/**
 * API Client for interfacing with the Groq API.
 */
export class VoiceClient extends APIClient {
  private _options: VoiceClientOptions;

  constructor(
    { ...opts }: VoiceClientOptions = {
      enableMic: true,
      startMicMuted: false,
      transport: DailyTransport,
    }
  ) {
    // Validate client options
    const options: VoiceClientOptions = {
      ...opts,
    };

    super({
      transport: options.transport
        ? new options.transport()!
        : new DailyTransport(),
    });

    this._options = options;
  }

  public getOptions = (): VoiceClientOptions => {
    return this._options;
  };
}

export const { GroqVoiceError } = Errors;
export const { VoiceEvent } = Events;
