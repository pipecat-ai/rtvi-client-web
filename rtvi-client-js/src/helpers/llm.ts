import { deepmerge } from "deepmerge-ts";

import { ActionData, VoiceClient, VoiceClientConfigOption } from "..";
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
export enum LLMEvent {
  LLMMessage = "llm-message",
  LLMContext = "llm-context",
  LLMFunctionCall = "llm-function-call",
  LLMFunctionStart = "llm-function-start",
}

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
  ): Promise<unknown> {
    const currentContext = this._voiceClient.getServiceOptionsFromConfig(
      service
    ) as VoiceClientConfigOption;

    currentContext.options = [
      ...currentContext.options.filter((option) => option.name !== "messages"),
      {
        name: "messages",
        value: context.messages,
      },
    ];

    const newConfig = deepmerge(currentContext, this._voiceClient.config);

    if (this._voiceClient.state === "ready") {
      return this._voiceClient.action({
        service,
        action: "update-context",
        arguments: [
          {
            name: "messages",
            value: context.messages,
          },
        ],
      } as ActionData);
    } else {
      return this._voiceClient.updateConfig(
        newConfig as VoiceClientConfigOption[]
      );
    }
  }

  public async appendContext(
    service: string,
    context: LLMContextMessage
  ): Promise<unknown> {
    this._voiceClient.getServiceOptionsFromConfig(service);

    if (this._voiceClient.state === "ready") {
      return this._voiceClient.action({
        service,
        action: "append-context",
        arguments: [
          {
            name: "messages",
            value: [context],
          },
        ],
      } as ActionData);
    } else {
      // Update config
    }
  }
}
