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
  constructor(options: LLMHelperOptions) {
    super(options);
    console.log(options);
  }

  public get llmContext(): LLMMessages | undefined {
    return undefined;
  }
}
