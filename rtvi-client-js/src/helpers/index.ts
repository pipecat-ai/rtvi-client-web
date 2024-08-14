import { VoiceClient } from "..";

export type VoiceClientHelpers = Partial<Record<string, VoiceClientHelper>>;

export type VoiceClientHelperCallbacks = Partial<object>;

export interface VoiceClientHelperOptions {
  /**
   * Callback methods for events / messages
   */
  callbacks?: VoiceClientHelperCallbacks;
}

export abstract class VoiceClientHelper {
  protected _options: VoiceClientHelperOptions;
  protected _voiceClient: VoiceClient;

  constructor(voiceClient: VoiceClient, options: VoiceClientHelperOptions) {
    this._voiceClient = voiceClient;
    this._options = options;
  }
}
