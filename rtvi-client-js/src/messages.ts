import { nanoid } from "nanoid";

import { Transport, RTVIClientConfigOption } from ".";

export enum RTVIMessageType {
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
  ERROR = "error", // Bot initialization error
  ERROR_RESPONSE = "error-response", // Error response from the bot in response to an action
  CONFIG = "config", // Bot configuration
  CONFIG_AVAILABLE = "config-available", // Configuration options available on the bot
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
  config: RTVIClientConfigOption[];
};

export type BotReadyData = {
  config: RTVIClientConfigOption[];
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

export type RTVIMessageActionResponse = {
  id: string;
  label: string;
  type: string;
  data: { result: unknown };
};

export class RTVIMessage {
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
  static clientReady(): RTVIMessage {
    return new RTVIMessage(RTVIMessageType.CLIENT_READY, {});
  }

  static updateConfig(
    config: RTVIClientConfigOption[],
    interrupt: boolean = false
  ): RTVIMessage {
    return new RTVIMessage(RTVIMessageType.UPDATE_CONFIG, {
      config,
      interrupt,
    });
  }

  static describeConfig(): RTVIMessage {
    return new RTVIMessage(RTVIMessageType.DESCRIBE_CONFIG, {});
  }

  static getBotConfig(): RTVIMessage {
    return new RTVIMessage(RTVIMessageType.GET_CONFIG, {});
  }

  static describeActions(): RTVIMessage {
    return new RTVIMessage(RTVIMessageType.DESCRIBE_ACTIONS, {});
  }

  // Actions (generic)
  static action(data: ActionData): RTVIMessage {
    return new RTVIMessage(RTVIMessageType.ACTION, data);
  }
}

export class RTVIMessageMetrics extends RTVIMessage {
  constructor(data: PipecatMetrics) {
    super(RTVIMessageType.METRICS, data, "0");
  }
}

// ----- Message Dispatcher

interface QueuedRTVIMessage {
  message: RTVIMessage;
  timestamp: number;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class MessageDispatcher {
  private _transport: Transport;
  private _gcTime: number;
  private _queue = new Array<QueuedRTVIMessage>();

  constructor(transport: Transport) {
    this._gcTime = 10000; // How long to wait before resolving the message
    this._queue = [];
    this._transport = transport;
  }

  public dispatch(
    message: RTVIMessage
  ): Promise<RTVIMessage | RTVIMessageActionResponse> {
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

    return promise as Promise<RTVIMessage | RTVIMessageActionResponse>;
  }

  private _resolveReject(
    message: RTVIMessage,
    resolve: boolean = true
  ): RTVIMessage {
    const queuedMessage = this._queue.find(
      (msg) => msg.message.id === message.id
    );

    if (queuedMessage) {
      if (resolve) {
        console.debug("[MessageDispatcher] Resolve", message);
        queuedMessage.resolve(
          message.type === RTVIMessageType.ACTION_RESPONSE
            ? (message as RTVIMessageActionResponse)
            : (message as RTVIMessage)
        );
      } else {
        console.debug("[MessageDispatcher] Reject", message);
        queuedMessage.reject(message as RTVIMessage);
      }
      // Remove message from queue
      this._queue = this._queue.filter((msg) => msg.message.id !== message.id);
      console.debug("[MessageDispatcher] Queue", this._queue);
    }

    return message;
  }

  public resolve(message: RTVIMessage): RTVIMessage {
    return this._resolveReject(message, true);
  }

  public reject(message: RTVIMessage): RTVIMessage {
    return this._resolveReject(message, false);
  }

  private _gc() {
    this._queue = this._queue.filter((msg) => {
      return Date.now() - msg.timestamp < this._gcTime;
    });
    console.debug("[MessageDispatcher] GC", this._queue);
  }
}

// @deprecated
export type VoiceMessageActionResponse = RTVIMessageActionResponse;
export type VoiceMessageType = RTVIMessageType;
export class VoiceMessage extends RTVIMessage {}
export class VoiceMessageMetrics extends RTVIMessageMetrics {}
