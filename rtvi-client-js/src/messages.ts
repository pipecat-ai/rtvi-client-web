import { v4 as uuidv4 } from "uuid";

import { httpActionGenerator } from "./actions";
import { RTVIClient, RTVIClientConfigOption } from "./client";

export const RTVI_MESSAGE_LABEL = "rtvi-ai";

export enum RTVIMessageType {
  // Outbound
  CLIENT_READY = "client-ready",
  UPDATE_CONFIG = "update-config",
  GET_CONFIG = "get-config",
  DESCRIBE_CONFIG = "describe-config",
  DESCRIBE_ACTIONS = "describe-actions",

  // Inbound
  BOT_READY = "bot-ready", // Bot is connected and ready to receive messages
  ERROR = "error", // Bot initialization error
  ERROR_RESPONSE = "error-response", // Error response from the bot in response to an action
  CONFIG = "config", // Bot configuration
  CONFIG_AVAILABLE = "config-available", // Configuration options available on the bot
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  ACTIONS_AVAILABLE = "actions-available", // Actions available on the bot
  ACTION_RESPONSE = "action-response", // Action response from the bot
  METRICS = "metrics", // RTVI reporting metrics
  USER_TRANSCRIPTION = "user-transcription", // Local user speech to text transcription (partials and finals)
  BOT_TRANSCRIPTION = "bot-transcription", // Bot full text transcription (sentence aggregated)
  USER_STARTED_SPEAKING = "user-started-speaking", // User started speaking
  USER_STOPPED_SPEAKING = "user-stopped-speaking", // User stopped speaking
  BOT_STARTED_SPEAKING = "bot-started-speaking", // Bot started speaking
  BOT_STOPPED_SPEAKING = "bot-stopped-speaking", // Bot stopped speaking
  // Service-specific
  USER_LLM_TEXT = "user-llm-text", // Aggregated user input text which is sent to LLM
  BOT_LLM_TEXT = "bot-llm-text", // Streamed token returned by the LLM (note: not sent when in connected state, use BOT_TTS_TEXT instead)
  BOT_LLM_STARTED = "bot-llm-started", // Bot LLM inference starts
  BOT_LLM_STOPPED = "bot-llm-stopped", // Bot LLM inference stops
  BOT_TTS_TEXT = "bot-tts-text", // Bot TTS text output (streamed word as it is spoken)
  BOT_TTS_STARTED = "bot-tts-started", // Bot TTS response starts
  BOT_TTS_STOPPED = "bot-tts-stopped", // Bot TTS response stops
  // Storage
  STORAGE_ITEM_STORED = "storage-item-stored", // Item was stored to configured storage, if applicable
}

// ----- Message Data Types

export type ConfigData = {
  config: RTVIClientConfigOption[];
};

export type BotReadyData = {
  config: RTVIClientConfigOption[];
  version: string;
};

export type PipecatMetricData = {
  processor: string;
  value: number;
};

export type PipecatMetricsData = {
  processing?: PipecatMetricData[];
  ttfb?: PipecatMetricData[];
  characters?: PipecatMetricData[];
};

export type TranscriptData = {
  text: string;
  final: boolean;
  timestamp: string;
  user_id: string;
};

export type BotLLMTextData = {
  text: string;
};

export type BotTTSTextData = {
  text: string;
};

export type StorageItemStoredData = {
  action: string;
  items: unknown;
};

// ----- Message Classes

export type RTVIMessageActionResponse = {
  id: string;
  label: string;
  type: string;
  data: { result: unknown };
};

export class RTVIMessage {
  id: string;
  label: string = RTVI_MESSAGE_LABEL;
  type: string;
  data: unknown;

  constructor(type: string, data: unknown, id?: string) {
    this.type = type;
    this.data = data;
    this.id = id || uuidv4().slice(0, 8);
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
}

// ----- Action Types

export const RTVI_ACTION_TYPE = "action";

export type RTVIActionRequestData = {
  service: string;
  action: string;
  arguments?: { name: string; value: unknown }[];
};

export class RTVIActionRequest extends RTVIMessage {
  constructor(data: RTVIActionRequestData) {
    super(RTVI_ACTION_TYPE, data);
  }
}

export type RTVIActionResponse = {
  id: string;
  label: string;
  type: string;
  data: { result: unknown };
};

// ----- Message Dispatcher

interface QueuedRTVIMessage {
  message: RTVIMessage;
  timestamp: number;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class MessageDispatcher {
  private _client: RTVIClient;
  private _gcTime: number;
  private _queue = new Array<QueuedRTVIMessage>();

  constructor(client: RTVIClient) {
    this._gcTime = 10000; // How long to wait before resolving the message
    this._queue = [];
    this._client = client;
  }

  public dispatch(message: RTVIMessage): Promise<RTVIMessage> {
    const promise = new Promise((resolve, reject) => {
      this._queue.push({
        message,
        timestamp: Date.now(),
        resolve,
        reject,
      });
    });

    console.debug("[MessageDispatcher] dispatch", message);

    this._client.sendMessage(message);

    this._gc();

    return promise as Promise<RTVIMessage | RTVIMessageActionResponse>;
  }

  public async dispatchAction(
    action: RTVIActionRequest,
    onMessage: (message: RTVIMessage) => void
  ): Promise<RTVIMessageActionResponse> {
    const promise = new Promise((resolve, reject) => {
      this._queue.push({
        message: action,
        timestamp: Date.now(),
        resolve,
        reject,
      });
    });

    console.debug("[MessageDispatcher] action", action);

    if (this._client.connected) {
      // Send message to transport when connected
      this._client.sendMessage(action);
    } else {
      const actionUrl = this._client.constructUrl("action");

      try {
        // Dispatch action via HTTP when disconnected
        await httpActionGenerator(
          actionUrl,
          action,
          this._client.params,
          (response: RTVIActionResponse) => {
            onMessage(response);
          }
        );
        // On HTTP success (resolve), send `action` message (for callbacks)
      } catch (e) {
        onMessage(
          new RTVIMessage(
            RTVIMessageType.ERROR_RESPONSE,
            `Action endpoint '${actionUrl}' returned an error response`,
            action.id
          )
        );
      }
    }

    this._gc();

    return promise as Promise<RTVIMessageActionResponse>;
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

// ----- Deprecated

/**
 * @deprecated Use RTVIMessageActionResponse instead.
 */
export type VoiceMessageActionResponse = RTVIMessageActionResponse;
/**
 * @deprecated Use RTVIMessageType instead.
 */
export type VoiceMessageType = RTVIMessageType;
/**
 * @deprecated Use RTVIMessage instead.
 */
export class VoiceMessage extends RTVIMessage {}
