import { VoiceClient, RTVIVoiceClientOptions } from "realtime-ai";

import { DailyTransport } from "./transport";

/**
 * Daily RTVI Voice Client
 */
export class DailyVoiceClient extends VoiceClient {
  constructor({ ...opts }: RTVIVoiceClientOptions) {
    const options: RTVIVoiceClientOptions = {
      ...opts,
      transport: DailyTransport,
    };

    super(options);
  }
}
