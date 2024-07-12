export enum TransportState {
  Idle = "idle",
  Connecting = "connecting",
  Connected = "connected",
  Disconnected = "disconnected",
  Error = "error",
}

export type Participant = {
  id: string;
  name: string;
  isLocal: boolean;
};

export abstract class Transport {
  constructor() {}

  abstract connect({ url }: { url: string }): void;

  abstract disconnect(): void;
}
