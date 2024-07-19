import { VoiceClientConfigLLM, VoiceClientConfigOptions } from ".";

enum VoiceMessageType {
  // Outbound
  CONFIG = "config",
  SPEAK = "speak",
  LLM_GET_CONTEXT = "llm-get-context",
  LLM_UPDATE_CONTEXT = "llm-update-context",

  GET_CONTEXT = "llm-context",
  UPDATE_CONTEXT = "llm-update-context",
  TOOL_RESPONSE = "tool-response", // Result of a clientside tool method

  // Inbound
  LLM_CONTEXT = "llm-context", // LLM context message
  TRANSCRIPT = "transcript", // STT transcript (both local and remote) flagged with partial, final or sentence
  CONFIG_UPDATED = "config-updated", // Configuration options have changed successfull
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  TOOL_CALL = "tool-call", // Instruction to call a clientside tool method (expects a serialized method name and params)

  // Inbound (optional / not yet implemented)
  INTERRUPT = "interrupt", // Local user interrupted the conversation
}

export class VoiceMessage {
  tag: string = "realtime-ai";
  type: string;
  data: {};

  constructor(type: string, data: {}) {
    this.type = type;
    this.data = data;
  }

  public serialize(): string {
    return JSON.stringify({
      type: this.type,
      tag: this.tag,
      data: this.data,
    });
  }

  // Outbound message types
  static config(configuration: VoiceClientConfigOptions): VoiceMessage {
    // Sent when the configuration options of services has changed
    return new VoiceMessage(VoiceMessageType.CONFIG, configuration);
  }

  static speak(message: string): VoiceMessage {
    // Sent when prompting the STT model to speak
    return new VoiceMessage(VoiceMessageType.SPEAK, { text: message });
  }

  static messages(): VoiceMessage {
    // Sent when requesting the latest LLM context
    return new VoiceMessage(VoiceMessageType.GET_CONTEXT, {});
  }

  static getLLMContext(): VoiceMessage {
    // Sent when requesting the latest LLM context
    return new VoiceMessage(VoiceMessageType.LLM_GET_CONTEXT, {});
  }

  static updateLLMContext(llmConfig: VoiceClientConfigLLM): VoiceMessage {
    // Sent when requesting the latest LLM context
    return new VoiceMessage(VoiceMessageType.LLM_UPDATE_CONTEXT, {
      config: {
        llm: llmConfig,
      },
    });
  }
}

export class VoiceMessageTranscript extends VoiceMessage {
  constructor(data: { text: string; final: boolean }) {
    super(VoiceMessageType.TRANSCRIPT, data);
  }
}
