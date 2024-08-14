import { deepmerge } from "deepmerge-ts";

import { VoiceClient, VoiceClientConfigOption } from "..";
import { VoiceClientHelper, VoiceClientHelperOptions } from ".";

// --- Types
export type LLMContextMessage = {
  role: string;
  content: string;
};

export type LLMContext = {
  messages?: LLMContextMessage[];
};

// --- Events
export type LLMEvent =
  | "llm-message"
  | "llm-context"
  | "llm-function-call"
  | "llm-function-start";

// --- Message types
export type LLMMessageType =
  | "llm-function-call"
  | "llm-function-call-start"
  | "llm-function-call-result"
  | "llm-json-completion";

// --- Callbacks
export type LLMHelperCallbacks = Partial<{
  onLLMMessage: (message: LLMContextMessage) => void;
}>;

// --- Interface and class
export interface LLMHelperOptions extends VoiceClientHelperOptions {
  callbacks?: LLMHelperCallbacks;
}

export class LLMHelper extends VoiceClientHelper {
  protected declare _options: LLMHelperOptions;

  constructor(voiceClient: VoiceClient, options: LLMHelperOptions) {
    super(voiceClient, options);
  }

  public getContext(): LLMContextMessage | undefined {
    return undefined;
  }

  public async updateContext(
    service: string,
    context: LLMContext
  ): Promise<void | null> {
    // Check if we have registered service with name service
    if (!service) {
      throw new Error("Target service name is required");
    }
    // Find matching service name in the config and update the messages
    const currentContext = this._voiceClient.config.find(
      (config: VoiceClientConfigOption) => config.service === service
    );

    if (!currentContext) {
      throw new Error("No service with name " + service + " found in config");
    }

    currentContext.options = [
      ...currentContext.options.filter((option) => option.name !== "messages"),
      {
        name: "messages",
        value: context.messages,
      },
    ];

    const newConfig = deepmerge(currentContext, this._voiceClient.config);

    if (this._voiceClient.state === "ready") {
      //@TODO: dispatch action
    } else {
      this._voiceClient.updateConfig(newConfig as VoiceClientConfigOption[]);
    }
  }
}
