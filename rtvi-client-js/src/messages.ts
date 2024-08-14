import { nanoid } from "nanoid";

import { Transport, VoiceClientConfigOption } from ".";

export enum VoiceMessageType {
  // Outbound
  UPDATE_CONFIG = "update-config",
  GET_CONFIG = "get-config",
  DESCRIBE_CONFIG = "describe-config",
  ACTION = "action",
  DESCRIBE_ACTIONS = "describe-actions",

  // Inbound
  BOT_READY = "bot-ready", // Bot is connected and ready to receive messages
  TRANSCRIPT = "transcript", // STT transcript (both local and remote) flagged with partial, final or sentence
  CONFIG = "config",
  ERROR = "error",
  CONFIG_AVAILABLE = "config-available", // Configuration options available on the bot
  CONFIG_UPDATED = "config-updated", // Configuration options have changed successfully
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  ACTIONS_AVAILABLE = "actions-available", // Actions available on the bot
  ACTION_RESPONSE = "action-response",
  METRICS = "metrics", // RTVI reporting metrics
  USER_TRANSCRIPTION = "user-transcription", // Local user speech to text
  BOT_TRANSCRIPTION = "tts-text", // Bot speech to text
  LLM_FUNCTION_CALL = "llm-function-call", // LLM requesting a function call
  LLM_FUNCTION_CALL_START = "llm-function-call-start", // The LLM has started returning a function call
  LLM_FUNCTION_CALL_RESULT = "llm-function-call-result",
  JSON_COMPLETION = "llm-json-completion", // Used for JSON responses from the LLM
  ERROR_RESPONSE = "error-response", // Error response from the bot
  USER_STARTED_SPEAKING = "user-started-speaking", // User started speaking
  USER_STOPPED_SPEAKING = "user-stopped-speaking", // User stopped speaking
  BOT_STARTED_SPEAKING = "bot-started-speaking", // Bot started speaking
  BOT_STOPPED_SPEAKING = "bot-stopped-speaking", // Bot stopped speaking
}

export type ConfigData = {
  config: VoiceClientConfigOption[];
};

export type BotReadyData = {
  config: VoiceClientConfigOption[];
  version: string;
};

export type ActionData = {
  service: string;
  action: string;
  arguments: { name: string; value: string }[];
};

export type PipecatMetricsData = {
  processor: string;
  value: number;
};

export type PipecatMetrics = {
  processing: PipecatMetricsData[];
  ttfb: PipecatMetricsData[];
};

export type Transcript = {
  text: string;
  final: boolean;
  timestamp: string;
  user_id: string;
};

export type LLMFunctionCallData = {
  function_name: string;
  tool_call_id: string;
  args: unknown;
  result?: unknown;
};

export class VoiceMessage {
  id: string;
  label: string = "rtvi-ai";
  type: string;
  data: unknown;

  constructor(type: string, data: unknown, id?: string) {
    this.type = type;
    this.data = data;
    if (id) {
      this.id = id;
    } else {
      this.id = nanoid(8);
    }
  }

  public serialize(): string {
    return JSON.stringify({
      type: this.type,
      label: this.label,
      data: this.data,
    });
  }

  // Outbound message types
  static updateConfig(config: VoiceClientConfigOption[]): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.UPDATE_CONFIG, { config });
  }

  static describeConfig(): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.DESCRIBE_CONFIG, {});
  }

  static getBotConfig(): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.GET_CONFIG, {});
  }

  static describeActions(): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.DESCRIBE_ACTIONS, {});
  }

  static llmFunctionCallResult(data: unknown): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.LLM_FUNCTION_CALL_RESULT, data);
  }

  // Actions (generic)
  static action(data: ActionData): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.ACTION, data);
  }
}

export class VoiceMessageMetrics extends VoiceMessage {
  constructor(data: PipecatMetrics) {
    super(VoiceMessageType.METRICS, data, "0");
  }
}

interface QueuedVoiceMessage {
  message: VoiceMessage;
  timestamp: number;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  shouldReject: boolean;
}

export class MessageDispatcher {
  private _transport: Transport;
  private _gcTime: number;
  private _queue = new Array<QueuedVoiceMessage>();

  constructor(transport: Transport) {
    this._gcTime = 10000; // How long to wait before resolving the message
    this._queue = [];
    this._transport = transport;
  }

  public dispatch(
    message: VoiceMessage,
    shouldReject: boolean = false
  ): Promise<unknown> {
    const promise = new Promise((resolve, reject) => {
      this._queue.push({
        message,
        timestamp: Date.now(),
        resolve,
        reject,
        shouldReject,
      });
    });

    this._transport.sendMessage(message);

    this._gc();

    return promise;
  }

  private _resolveReject(
    message: VoiceMessage,
    resolve: boolean = true
  ): VoiceMessage {
    const queuedMessage = this._queue.find(
      (msg) => msg.message.id === message.id
    );

    if (queuedMessage) {
      if (resolve) {
        queuedMessage.resolve(message as VoiceMessage);
      } else {
        if (queuedMessage.shouldReject) {
          queuedMessage.reject(message as VoiceMessage);
        }
      }
      // Remove message from queue
      this._queue = this._queue.filter((msg) => msg.message.id !== message.id);
    } else {
      //@TODO handle unknown message here
    }

    return message;
  }

  public resolve(message: VoiceMessage): VoiceMessage {
    return this._resolveReject(message, true);
  }

  public reject(message: VoiceMessage): VoiceMessage {
    return this._resolveReject(message, false);
  }

  private _gc() {
    this._queue = this._queue.filter((msg) => {
      return Date.now() - msg.timestamp < this._gcTime;
    });
  }
}
