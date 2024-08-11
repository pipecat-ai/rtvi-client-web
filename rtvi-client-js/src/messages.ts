import { nanoid } from "nanoid";

import { VoiceClientConfigOption } from ".";

export enum VoiceMessageType {
  // Outbound
  UPDATE_CONFIG = "update-config",
  GET_CONFIG = "get-config",
  DESCRIBE_CONFIG = "describe-config",
  ACTION = "action",
  DESCRIBE_ACTIONS = "describe-actions",

  // Inbound
  BOT_READY = "bot-ready", // Bot is connected and ready to receive messages
  ERROR_RESPONSE = "error-response", // Error response from the bot
  TRANSCRIPT = "transcript", // STT transcript (both local and remote) flagged with partial, final or sentence
  CONFIG = "config",
  CONFIG_AVAILABLE = "config-available", // Configuration options available on the bot
  CONFIG_UPDATED = "config-updated", // Configuration options have changed successfull
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  ACTIONS_AVAILABLE = "actions-available", // Actions available on the bot
  TOOL_CALL = "tool-call", // Instruction to call a clientside tool method (expects a serialized method name and params)
  JSON_COMPLETION = "json-completion", // JSON message is complete
  METRICS = "metrics", // RTVI reporting metrics
  USER_TRANSCRIPTION = "user-transcription", // Local user speech to text
  BOT_TRANSCRIPTION = "tts-text", // Bot speech to text
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
