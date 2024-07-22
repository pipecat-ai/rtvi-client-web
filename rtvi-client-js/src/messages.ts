import { nanoid } from "nanoid";

import {
  VoiceClientConfigLLM,
  VoiceClientConfigOptions,
  VoiceClientLLMMessage,
} from ".";

export enum VoiceMessageType {
  // Outbound
  CONFIG = "config-update",
  LLM_GET_CONTEXT = "llm-get-context",
  LLM_UPDATE_CONTEXT = "llm-update-context",
  LLM_APPEND_CONTEXT = "llm-append-context",
  SPEAK = "tts-speak",
  INTERRUPT = "tts-interrupt",

  // Inbound
  BOT_READY = "bot-ready", // Bot is connected and ready to receive messages
  LLM_CONTEXT = "llm-context", // LLM context message
  TRANSCRIPT = "transcript", // STT transcript (both local and remote) flagged with partial, final or sentence
  CONFIG_UPDATED = "config-updated", // Configuration options have changed successfull
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  TOOL_CALL = "tool-call", // Instruction to call a clientside tool method (expects a serialized method name and params)
  JSON_COMPLETION = "json-completion", // JSON message is complete
  METRICS = "metrics", // RTVI reporting metrics
  USER_TRANSCRIPTION = "user-transcription",
  BOT_TRANSCRIPTION = "tts-text",
  // Inbound (optional / not yet implemented)
  //TOOL_RESPONSE = "tool-response", // Result of a clientside tool method
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

export class VoiceMessage {
  id: string;
  label: string = "rtvi";
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
  static config(configuration: VoiceClientConfigOptions): VoiceMessage {
    // Sent when the configuration options of services has changed
    // We only send a partial configuration update to the bot related to the pipeline
    return new VoiceMessage(VoiceMessageType.CONFIG, {
      config: {
        llm: configuration.llm,
        tts: configuration.tts,
      },
    });
  }

  // TTS
  static speak(message: string, interrupt: boolean): VoiceMessage {
    // Sent when prompting the STT model to speak
    return new VoiceMessage(VoiceMessageType.SPEAK, {
      tts: { text: message, interrupt },
    });
  }

  static interrupt(): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.INTERRUPT, {});
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
}

export class VoiceMessageMetrics extends VoiceMessage {
  constructor(data: PipecatMetrics) {
    super(VoiceMessageType.METRICS, data, "0");
  }
}
