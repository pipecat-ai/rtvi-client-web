

import { VoiceClient, VoiceClientOptions } from 'realtime-ai';
import { RNDailyTransport } from "./transport";

/**
 * Daily RTVI Voice Client for React Native
 */
export class RNDailyVoiceClient extends VoiceClient{

  constructor(options: VoiceClientOptions) {
    options.transport = RNDailyTransport
    super(options)
  }
}

