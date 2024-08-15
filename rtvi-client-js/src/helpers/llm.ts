import { deepmerge } from "deepmerge-ts";

import { ActionData, VoiceClientConfigOption, VoiceMessage } from "..";
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
  LLM_FUNCTION_CALL = "llm-function-call",
  LLM_FUNCTION_CALL_START = "llm-function-call-start",
  LLM_FUNCTION_CALL_RESULT = "llm-function-call-result",
  LLM_JSON_COMPLETION = "llm-json-completion",
}
// --- Message types
export enum LLMMessageType {
  LLM_FUNCTION_CALL = "llm-function-call",
  LLM_FUNCTION_CALL_START = "llm-function-call-start",
  LLM_FUNCTION_CALL_RESULT = "llm-function-call-result",
  LLM_JSON_COMPLETION = "llm-json-completion",
}

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

  constructor(options: LLMHelperOptions) {
    super(options);
  }

  public getContext(): LLMContextMessage | undefined {
    return undefined;
  }

  public async updateContext(context: LLMContext): Promise<unknown> {
    const currentContext = this._voiceClient.getServiceOptionsFromConfig(
      this._service
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
        service: this._service,
        action: "update_context",
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

  public async appendContext(context: LLMContextMessage): Promise<unknown> {
    this._voiceClient.getServiceOptionsFromConfig(this._service);

    if (this._voiceClient.state === "ready") {
      return this._voiceClient.action({
        service: this._service,
        action: "append_context",
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

  public handleMessage(ev: VoiceMessage): void {
    console.log(ev);
  }

  public getMessageTypes(): string[] {
    return Object.values(LLMMessageType) as string[];
  }
}
