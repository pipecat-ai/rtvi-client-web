export class VoiceError extends Error {
  readonly status: number | undefined;
  readonly error: Object | undefined;

  constructor(message?: string) {
    super(message); // Pass the message to the Error constructor
    this.error = { message };
  }
}

export class BotStartError extends VoiceError {
  override readonly status: 400 = 400;
  constructor(message?: string | undefined) {
    super(message ?? "Unable to instantiate new bot instance");
  }
}

export class RateLimitError extends VoiceError {
  override readonly status: 429 = 429;
  constructor(message?: string | undefined) {
    super(message ?? "Rate limit exceeded");
  }
}

export class ConfigUpdateError extends VoiceError {
  override readonly status: 400 = 400;
  constructor(message?: string | undefined) {
    super(message ?? "Unable to update configuration");
  }
}
