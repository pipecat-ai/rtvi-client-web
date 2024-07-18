import { VoiceClientConfigOptions } from ".";

enum VoiceMessageType {
  CONFIG = "config",
  SPEAK = "speak",
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

  // Message types
  static config(configuration: VoiceClientConfigOptions): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.CONFIG, configuration);
  }

  static speak(message: string): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.SPEAK, { text: message });
  }
}
