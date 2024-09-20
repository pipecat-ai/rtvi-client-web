import { RTVIVoiceClient, RTVIVoiceClientOptions } from "realtime-ai";

import { DailyTransport } from "./transport";

/**
 * Daily RTVI Voice Client
 */
export class DailyVoiceClient extends RTVIVoiceClient {
  constructor({ ...opts }: RTVIVoiceClientOptions) {
    const options: RTVIVoiceClientOptions = {
      ...opts,
      transport: DailyTransport,
    };

    super(options);
  }
}
