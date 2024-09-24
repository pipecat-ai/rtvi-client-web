export class RTVIError extends Error {
  readonly status: number | undefined;
  readonly error: unknown | undefined;

  constructor(message?: string, status?: number | undefined) {
    super(message);
    this.error = { message };
    this.status = status;
  }
}

export class ConnectionTimeoutError extends RTVIError {
  constructor(message?: string | undefined) {
    super(
      message ??
        "Bot did not enter ready state within the specified timeout period."
    );
  }
}

export class StartBotError extends RTVIError {
  readonly error: string = "invalid-request-error";
  constructor(message?: string | undefined, status?: number, error?: string) {
    super(
      message ?? `Failed to connect / invalid auth bundle from base url`,
      status ?? 500
    );
    this.error = error ?? this.error;
  }
}

export class TransportStartError extends RTVIError {
  constructor(message?: string | undefined) {
    super(message ?? "Unable to connect to transport");
  }
}

export class BotNotReadyError extends RTVIError {
  constructor(message?: string | undefined) {
    super(
      message ??
        "Attempt to call action on transport when not in 'ready' state."
    );
  }
}

export class ConfigUpdateError extends RTVIError {
  override readonly status = 400;
  constructor(message?: string | undefined) {
    super(message ?? "Unable to update configuration");
  }
}

/**
 * @deprecated Use RTVIError instead.
 */
export class VoiceError extends RTVIError {}
