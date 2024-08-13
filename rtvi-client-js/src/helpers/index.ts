export type VoiceClientHelperCallbacks = Partial<object>;

export interface VoiceClientHelperOptions {
  callbacks?: VoiceClientHelperCallbacks;
}

export abstract class VoiceClientHelper {
  protected _options: VoiceClientHelperOptions;

  constructor(options: VoiceClientHelperOptions) {
    this._options = options;
  }
}
