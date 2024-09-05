import { nanoid } from "nanoid";

import { Transport, VoiceClientConfigOption } from ".";

export enum VoiceMessageType {
  // Outbound
  CLIENT_READY = "client-ready",
  UPDATE_CONFIG = "update-config",
  GET_CONFIG = "get-config",
  DESCRIBE_CONFIG = "describe-config",
  ACTION = "action",
  DESCRIBE_ACTIONS = "describe-actions",

  // Inbound
  BOT_READY = "bot-ready", // Bot is connected and ready to receive messages
  TRANSCRIPT = "transcript", // STT transcript (both local and remote) flagged with partial, final or sentence
  CONFIG = "config", // Bot configuration
  ERROR = "error", // Bot initialization error
  ERROR_RESPONSE = "error-response", // Error response from the bot in response to an action
  CONFIG_AVAILABLE = "config-available", // Configuration options available on the bot
  CONFIG_UPDATED = "config-updated", // Configuration options have changed successfully
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  ACTIONS_AVAILABLE = "actions-available", // Actions available on the bot
  ACTION_RESPONSE = "action-response",
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
  arguments: { name: string; value: unknown }[];
};

export type PipecatMetricsData = {
  processor: string;
  value: number;
};

export type PipecatMetrics = {
  processing?: PipecatMetricsData[];
  ttfb?: PipecatMetricsData[];
  characters?: PipecatMetricsData[];
};

export type Transcript = {
  text: string;
  final: boolean;
  timestamp: string;
  user_id: string;
};

export type VoiceMessageActionResponse = {
  id: string;
  label: string;
  type: string;
  data: { result: unknown };
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

  // Outbound message types
  static clientReady(): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.CLIENT_READY, {});
  }

  static updateConfig(
    config: VoiceClientConfigOption[],
    interrupt: boolean = false
  ): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.UPDATE_CONFIG, {
      config,
      interrupt,
    });
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

// ----- Message Dispatcher

interface QueuedVoiceMessage {
  message: VoiceMessage;
  timestamp: number;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
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
    message: VoiceMessage
  ): Promise<VoiceMessage | VoiceMessageActionResponse> {
    const promise = new Promise((resolve, reject) => {
      this._queue.push({
        message,
        timestamp: Date.now(),
        resolve,
        reject,
      });
    });

    console.debug("[MessageDispatcher] dispatch", message);
    this._transport.sendMessage(message);

    this._gc();

    return promise as Promise<VoiceMessage | VoiceMessageActionResponse>;
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
        console.debug("[MessageDispatcher] Resolve", message);
        queuedMessage.resolve(
          message.type === VoiceMessageType.ACTION_RESPONSE
            ? (message as VoiceMessageActionResponse)
            : (message as VoiceMessage)
        );
      } else {
        console.debug("[MessageDispatcher] Reject", message);
        queuedMessage.reject(message as VoiceMessage);
      }
      // Remove message from queue
      this._queue = this._queue.filter((msg) => msg.message.id !== message.id);
      console.debug("[MessageDispatcher] Queue", this._queue);
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
    console.debug("[MessageDispatcher] GC", this._queue);
  }
}
