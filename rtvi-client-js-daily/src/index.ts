import { VoiceClient, VoiceClientOptions } from "realtime-ai";

import { DailyTransport } from "./transport";

/**
 * Daily RTVI Voice Client
 */
export class DailyVoiceClient extends VoiceClient {
  constructor({ ...opts }: VoiceClientOptions) {
    const options: VoiceClientOptions = {
      ...opts,
      transport: DailyTransport,
      services: opts.services,
      config: opts.config || [],
    };

    super(options);
  }
}
