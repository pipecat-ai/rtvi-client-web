import { VoiceClientHelper, VoiceClientHelperOptions } from ".";

export type LLMMessage = {
  role: string;
  content: string;
};

export type LLMMessages = {
  messages?: LLMMessage[];
};

export type LLMHelperCallbacks = Partial<{
  onLLMMessage: (message: LLMMessage) => void;
}>;

export interface LLMHelperOptions extends VoiceClientHelperOptions {
  callbacks?: LLMHelperCallbacks;
}

export class LLMHelper extends VoiceClientHelper {
  protected override _options: LLMHelperOptions;

  constructor(options: LLMHelperOptions) {
    super(options);
    this._options = options;
  }

  public getContext(): LLMMessages | undefined {
    return undefined;
  }
}
