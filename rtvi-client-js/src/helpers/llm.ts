import {
  ActionData,
  VoiceClientConfigOption,
  VoiceEvent,
  VoiceMessage,
} from "..";
import * as VoiceErrors from "./../errors";
import { VoiceClientHelper, VoiceClientHelperOptions } from ".";

// --- Types

export type LLMFunctionCallData = {
  function_name: string;
  tool_call_id: string;
  args: unknown;
  result?: unknown;
};

export type LLMContextMessage = {
  role: string;
  content: string;
};

export type LLMContext = {
  messages?: LLMContextMessage[];
};

export type FunctionCallParams = {
  functionName: string;
  arguments: unknown;
};

export type FunctionCallCallback = (fn: FunctionCallParams) => Promise<unknown>;

// --- Message types
export enum LLMMessageType {
  LLM_FUNCTION_CALL = "llm-function-call",
  LLM_FUNCTION_CALL_START = "llm-function-call-start",
  LLM_FUNCTION_CALL_RESULT = "llm-function-call-result",
  LLM_JSON_COMPLETION = "llm-json-completion",
}

// --- Callbacks
export type LLMHelperCallbacks = Partial<{
  onLLMJsonCompletion: (jsonString: string) => void;
  onLLMFunctionCall: (func: LLMFunctionCallData) => void;
  onLLMFunctionCallStart: (functionName: string) => void;
  onLLMMessage: (message: LLMContextMessage) => void;
}>;

// --- Interface and class
export interface LLMHelperOptions extends VoiceClientHelperOptions {
  callbacks?: LLMHelperCallbacks;
}

export class LLMHelper extends VoiceClientHelper {
  protected declare _options: LLMHelperOptions;
  private _functionCallCallback: FunctionCallCallback | null;

  constructor(options: LLMHelperOptions) {
    super(options);

    this._functionCallCallback = null;
  }

  public getMessageTypes(): string[] {
    return Object.values(LLMMessageType) as string[];
  }

  /**
   * LLM context messages key
   * If the transport is in the ready state, the key is "messages"
   * Otherwise, the key is "initial_messages"
   * @returns string
   */
  private _getMessagesKey(): string {
    return this._voiceClient.state === "ready"
      ? "messages"
      : "initial_messages";
  }

  // --- Actions

  /**
   * Bot's current LLM context.
   * @returns Promise<LLMContextMessage[]>
   */
  public async getContext(): Promise<LLMContextMessage[]> {
    if (this._voiceClient.state === "ready") {
      return this._voiceClient.action({
        service: this._service,
        action: "get_context",
      } as ActionData) as Promise<LLMContextMessage[]>;
    } else {
      const currentContext: LLMContextMessage[] =
        this._voiceClient.getServiceOptionValueFromConfig(
          this._service,
          this._getMessagesKey()
        ) as LLMContextMessage[];

      return [...currentContext];
    }
  }

  /**
   * Update the bot's LLM context.
   * If this is called while the transport is not in the ready state, the local context will be updated
   * @param context LLMContext - The new context
   * @param interrupt boolean - Whether to interrupt the bot, or wait until it has finished speaking
   * @returns Promise<unknown>
   */
  public async setContext(
    context: LLMContext,
    interrupt: boolean = false
  ): Promise<VoiceClientConfigOption[]> {
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
      } as ActionData) as Promise<VoiceClientConfigOption[]>;
    } else {
      const newConfig: VoiceClientConfigOption[] =
        this._voiceClient.setServiceOptionInConfig(this._service, {
          name: messages_key,
          value: context.messages,
        });
      this._voiceClient.updateConfig(newConfig);

      return newConfig;
    }
  }

  /**
   * Append a new message to the LLM context.
   * If this is called while the transport is not in the ready state, the local context will be updated
   * @param context LLMContextMessage
   * @param runImmediately boolean - wait until pipeline is idle before running
   * @returns
   */
  public async appendToMessages(
    context: LLMContextMessage,
    runImmediately: boolean = false
  ): Promise<VoiceClientConfigOption[]> {
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
      } as ActionData) as Promise<VoiceClientConfigOption[]>;
    } else {
      const currentMessages = this._voiceClient.getServiceOptionValueFromConfig(
        this._service,
        messages_key
      ) as LLMContextMessage[];

      const newConfig: VoiceClientConfigOption[] =
        this._voiceClient.setServiceOptionInConfig(this._service, {
          name: messages_key,
          value: [...currentMessages, context],
        });
      this._voiceClient.updateConfig(newConfig);

      return newConfig;
    }
  }

  /**
   * Run the bot's current LLM context.
   * Useful when appending messages to the context without runImmediately set to true.
   * Will do nothing if the bot is not in the ready state.
   * @param interrupt boolean - Whether to interrupt the bot, or wait until it has finished speaking
   * @returns Promise<unknown>
   */
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

  /**
   * If the LLM wants to call a function, RTVI will invoke the callback defined
   * here. Whatever the callback returns will be sent to the LLM as the function result.
   * @param callback
   * @returns void
   */
  public handleFunctionCall(callback: FunctionCallCallback): void {
    this._functionCallCallback = callback;
  }

  public handleMessage(ev: VoiceMessage): void {
    switch (ev.type) {
      case LLMMessageType.LLM_JSON_COMPLETION:
        this._options.callbacks?.onLLMJsonCompletion?.(ev.data as string);
        this._voiceClient.emit(VoiceEvent.LLMJsonCompletion, ev.data as string);
        break;
      case LLMMessageType.LLM_FUNCTION_CALL: {
        const d = ev.data as LLMFunctionCallData;
        this._options.callbacks?.onLLMFunctionCall?.(
          ev.data as LLMFunctionCallData
        );
        this._voiceClient.emit(
          VoiceEvent.LLMFunctionCall,
          ev.data as LLMFunctionCallData
        );
        if (this._functionCallCallback) {
          const fn = {
            functionName: d.function_name,
            arguments: d.args,
          };
          if (this._voiceClient.state === "ready") {
            this._functionCallCallback(fn).then((result) => {
              this._voiceClient.sendMessage(
                new VoiceMessage(LLMMessageType.LLM_FUNCTION_CALL_RESULT, {
                  function_name: d.function_name,
                  tool_call_id: d.tool_call_id,
                  arguments: d.args,
                  result,
                })
              );
            });
          } else {
            throw new VoiceErrors.BotNotReadyError(
              "Attempted to send a function call result from bot while transport not in ready state"
            );
          }
        }
        break;
      }
      case LLMMessageType.LLM_FUNCTION_CALL_START: {
        const e = ev.data as LLMFunctionCallData;
        this._options.callbacks?.onLLMFunctionCallStart?.(
          e.function_name as string
        );
        this._voiceClient.emit(
          VoiceEvent.LLMFunctionCallStart,
          e.function_name
        );
        break;
      }
    }
  }
}
