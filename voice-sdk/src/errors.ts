export class VoiceError extends Error {
  readonly status: number | undefined;
  readonly error: Object | undefined;
}

export class BotStartError extends VoiceError {
  override readonly status: 400 = 400;
  override readonly error = {
    message: "Unable to instantiate new bot instance",
  };
}

export class RateLimitError extends VoiceError {
  override readonly status: 429 = 429;
  override readonly error = { message: "Rate limit exceeded" };
}

export class BadRequestError extends VoiceError {
  override readonly status: 400 = 400;
}

export class AuthenticationError extends VoiceError {
  override readonly status: 401 = 401;
}

export class PermissionDeniedError extends VoiceError {
  override readonly status: 403 = 403;
}

export class NotFoundError extends VoiceError {
  override readonly status: 404 = 404;
}

export class ConflictError extends VoiceError {
  override readonly status: 409 = 409;
}

export class UnprocessableEntityError extends VoiceError {
  override readonly status: 422 = 422;
}

export class InternalServerError extends VoiceError {}
