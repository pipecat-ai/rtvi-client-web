import { nanoid } from "nanoid";

import {
  VoiceClientConfigLLM,
  VoiceClientConfigOption,
  VoiceClientLLMMessage,
} from ".";

export enum VoiceMessageType {
  // Outbound
  UPDATE_CONFIG = "update-config",
  GET_CONFIG = "get-config",
  DESCRIBE_CONFIG = "describe-config",
  LLM_GET_CONTEXT = "llm-get-context",
  LLM_UPDATE_CONTEXT = "llm-update-context",
  LLM_APPEND_CONTEXT = "llm-append-context",
  ACTION = " action",

  // Inbound
  BOT_READY = "bot-ready", // Bot is connected and ready to receive messages
  LLM_CONTEXT = "llm-context", // LLM context message
  TRANSCRIPT = "transcript", // STT transcript (both local and remote) flagged with partial, final or sentence
  CONFIG = "config",
  CONFIG_AVAILABLE = "config-available", // Configuration options available on the bot
  CONFIG_UPDATED = "config-updated", // Configuration options have changed successfull
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  TOOL_CALL = "tool-call", // Instruction to call a clientside tool method (expects a serialized method name and params)
  JSON_COMPLETION = "json-completion", // JSON message is complete
  METRICS = "metrics", // RTVI reporting metrics
  USER_TRANSCRIPTION = "user-transcription", // Local user speech to text
  BOT_TRANSCRIPTION = "tts-text", // Bot speech to text
  LLM_FUNCTION_CALL = "llm-function-call", // LLM requesting a function call
}

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

export type BotReadyData = {
  config: VoiceClientConfigOption[];
  version: string;
};

export type ActionData = {
  service: string;
  action: string;
  arguments: { name: string; value: string }[];
};

export type LLMFunctionCallData = {
  function_name: string;
  args: any;
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

  // LLM
  static getLLMContext(): VoiceMessage {
    // Sent when requesting the latest LLM context
    return new VoiceMessage(VoiceMessageType.LLM_GET_CONTEXT, {});
  }

  static updateLLMContext(llmConfig: VoiceClientConfigLLM): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.LLM_UPDATE_CONTEXT, {
      llm: llmConfig,
    });
  }

  static appendLLMContext(messages: VoiceClientLLMMessage[]): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.LLM_APPEND_CONTEXT, {
      llm: { messages },
    });
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
