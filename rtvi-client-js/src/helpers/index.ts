export type VoiceClientHelperCallbacks = Partial<object>;

export interface VoiceClientHelperOptions {
  callbacks?: VoiceClientHelperCallbacks;
}

export abstract class VoiceClientHelper {
  constructor(options: VoiceClientHelperOptions) {
    console.log(options);
  }
}
