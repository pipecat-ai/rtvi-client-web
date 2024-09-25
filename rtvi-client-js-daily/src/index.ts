import { RTVIClient, RTVIClientOptions } from "realtime-ai";

import { DailyTransport } from "./transport";

/**
 * Daily RTVI Voice Client
 */
export class DailyVoiceClient extends RTVIClient {
  constructor({ ...opts }: RTVIClientOptions) {
    const options: RTVIClientOptions = {
      ...opts,
      transport: new DailyTransport(),
    };

    super(options);
  }
}

export * from "./transport";
