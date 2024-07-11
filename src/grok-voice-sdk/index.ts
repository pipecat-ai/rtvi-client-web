import * as Errors from "./error";
import { Transport } from "./transport";
import { DailyTransport } from "./transport";

export interface VoiceClientOptions {
  apiKey?: string;

  /**
   * Override the default transport for media streaming.
   *
   * Defaults to DailyTransport
   */
  transport?: Transport;
}

/**
 * API Client for interfacing with the Groq API.
 *
 * @param {string | undefined} [opts.apiKey]
 */
export class VoiceClient {
  private readonly apiKey: string;
  private _options: VoiceClientOptions;
  private _transport: Transport | undefined;

  constructor({ apiKey, ...opts }: VoiceClientOptions = {}) {
    if (apiKey === undefined || apiKey === "") {
      throw new Errors.GroqVoiceError(
        "You must pass a valid Groq API key to the VoiceClient constructor."
      );
    }

    const options: VoiceClientOptions = {
      apiKey,
      ...opts,
    };

    this.apiKey = apiKey;
    this._options = options;
  }

  async start() {
    console.log("VoiceClient starting");

    this._transport = new DailyTransport();

    // @DEBUG
    console.log(this.apiKey);
    console.log(this._options);
    console.log(this._transport);
  }
}

export const { GroqVoiceError } = Errors;
