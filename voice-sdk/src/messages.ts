import { VoiceClientConfigOptions } from ".";

enum VoiceMessageTag {
  // Outbound
  CONFIG = "config",
  SPEAK = "speak",
  GET_MESSAGES = "messages",
  TOOL_RESPONSE = "tool-response", // Result of a clientside tool method

  // Inbound
  MESSAGES = "messages", // LLM context message
  TRANSCRIPT = "transcript", // STT transcript (both local and remote) flagged with partial, final or sentence
  CONFIG_UPDATED = "config-updated", // Configuration options have changed successfull
  CONFIG_ERROR = "config-error", // Configuration options have changed failed
  TOOL_CALL = "tool", // Instruction to call a clientside tool method (expects a serialized method name and params)

  // Inbound (optional / not yet implemented)
  INTERRUPT = "interrupt", // Local user interrupted the conversation
}

export class VoiceMessage {
  type: string = "realtime-ai";
  tag: string;
  data: {};

  constructor(tag: string, data: {}) {
    this.tag = tag;
    this.data = data;
  }

  public serialize(): string {
    return JSON.stringify({
      type: this.type,
      tag: this.tag,
      data: this.data,
    });
  }

  // Dispatch message types
  static config(configuration: VoiceClientConfigOptions): VoiceMessage {
    // Sent when the configuration options of services has changed
    return new VoiceMessage(VoiceMessageTag.CONFIG, configuration);
  }

  static speak(message: string): VoiceMessage {
    // Sent when prompting the STT model to speak
    return new VoiceMessage(VoiceMessageTag.SPEAK, { text: message });
  }

  static messages(): VoiceMessage {
    // Sent when requesting the latest LLM context
    return new VoiceMessage(VoiceMessageTag.GET_MESSAGES, {});
  }
}
