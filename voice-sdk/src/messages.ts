enum VoiceMessageType {
  CONFIGURE = "configure",
  SPEAK = "speak",
}

export class VoiceMessage {
  type: string;
  message: {};

  constructor(type: string, message: {}) {
    this.type = type;
    this.message = message;
  }

  public serialize(): string {
    return JSON.stringify({
      type: this.type,
      message: this.message,
    });
  }

  // Message types
  static configure(configuration: {}): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.CONFIGURE, configuration);
  }

  static speak(message: string): VoiceMessage {
    return new VoiceMessage(VoiceMessageType.SPEAK, { text: message });
  }
}
