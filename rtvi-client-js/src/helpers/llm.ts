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

  private _getMessagesKey(): string {
    return this._voiceClient.state === "ready"
      ? "messages"
      : "initial_messages";
  }

  public getMessageTypes(): string[] {
    return Object.values(LLMMessageType) as string[];
  }

  // --- Actions

  public getContext(): Promise<unknown> | void {
    //@TODO: handle non-ready return too

    if (this._voiceClient.state === "ready") {
      return this._voiceClient.action({
        service: this._service,
        action: "get_context",
      } as ActionData);
    }
  }

  public async setContext(
    context: LLMContext,
    interrupt: boolean = false
  ): Promise<unknown> {
    const currentContext = this._voiceClient.getServiceOptionsFromConfig(
      this._service
    ) as VoiceClientConfigOption;

    const messages_key = this._getMessagesKey();

    currentContext.options = [
      ...currentContext.options.filter(
        (option) => option.name !== messages_key
      ),
      {
        name: messages_key,
        value: context.messages,
      },
    ];

    const newConfig = deepmerge(currentContext, this._voiceClient.config);

    if (this._voiceClient.state === "ready") {
      return this._voiceClient.action({
        service: this._service,
        action: "set_context",
        arguments: [
          {
            name: messages_key,
            value: context.messages,
          },
          {
            name: "interrupt",
            value: interrupt,
          },
        ],
      } as ActionData);
    } else {
      return this._voiceClient.updateConfig(
        newConfig as VoiceClientConfigOption[]
      );
    }
  }

  public async appendToMessages(
    context: LLMContextMessage,
    runImmediately: boolean = false
  ): Promise<unknown> {
    this._voiceClient.getServiceOptionsFromConfig(this._service);

    const messages_key = this._getMessagesKey();

    if (this._voiceClient.state === "ready") {
      return this._voiceClient.action({
        service: this._service,
        action: "append_to_messages",
        arguments: [
          {
            name: messages_key,
            value: [context],
          },
          {
            name: "run_immediately",
            value: runImmediately,
          },
        ],
      } as ActionData);
    } else {
      // @TODO: Update initial messages config
    }
  }

  public async run(interrupt: boolean = false): Promise<unknown> {
    if (this._voiceClient.state !== "ready") {
      return;
    }

    return this._voiceClient.action({
      service: this._service,
      action: "run",
      arguments: [
        {
          name: "interrupt",
          value: interrupt,
        },
      ],
    } as ActionData);
  }

  // --- Handlers

  public handleMessage(ev: VoiceMessage): void {
    console.log(ev);
  }
}
