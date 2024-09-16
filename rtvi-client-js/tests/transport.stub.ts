import {
  Tracks,
  Transport,
  TransportState,
  RTVIClientOptions,
  RTVIMessage,
  RTVIMessageType,
} from "../src";

export class TransportStub extends Transport {
  constructor(
    options: RTVIClientOptions,
    onMessage: (ev: RTVIMessage) => void
  ) {
    super(options, onMessage);
  }

  public initDevices(): Promise<void> {
    return Promise.resolve();
  }

  public connect(): Promise<void> {
    this.state = "connected";
    return Promise.resolve();
  }

  public disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async sendReadyMessage(): Promise<void> {
    return new Promise<void>((resolve) => {
      (async () => {
        resolve();

        this._onMessage({
          label: "rtvi-ai",
          id: "123",
          type: RTVIMessageType.BOT_READY,
          data: {
            config: this._options.config,
          },
        } as RTVIMessage);
      })();
    });
  }

  public getAllMics(): Promise<MediaDeviceInfo[]> {
    return Promise.resolve([]);
  }
  public getAllCams(): Promise<MediaDeviceInfo[]> {
    return Promise.resolve([]);
  }

  public updateMic(micId: string): void {
    console.log(micId);
    return;
  }
  public updateCam(camId: string): void {
    console.log(camId);
    return;
  }

  public get selectedMic(): MediaDeviceInfo | Record<string, never> {
    return {};
  }
  public get selectedCam(): MediaDeviceInfo | Record<string, never> {
    return {};
  }

  public enableMic(enable: boolean): void {
    console.log(enable);
    return;
  }
  public enableCam(enable: boolean): void {
    console.log(enable);
    return;
  }

  public get isCamEnabled(): boolean {
    return true;
  }
  public get isMicEnabled(): boolean {
    return true;
  }

  public sendMessage(message: RTVIMessage) {
    if (message.type === RTVIMessageType.ACTION) {
      this._onMessage({
        type: RTVIMessageType.ACTION_RESPONSE,
        id: "123",
        label: "rtvi-ai",
        data: {
          result: true,
        },
      });
    } else {
      // Mock the response from the server
      console.log("[STUB] message.type:", message.type);

      switch (message.type) {
        case RTVIMessageType.UPDATE_CONFIG:
          this._onMessage({
            ...message,
            type: RTVIMessageType.CONFIG,
          });
          break;
        case RTVIMessageType.GET_CONFIG:
          this._onMessage({
            ...message,
            data: { config: this._options.config },
            type: RTVIMessageType.CONFIG,
          });
          break;
        default:
          this._onMessage(message);
      }
    }
    return true;
  }

  public get state(): TransportState {
    return this._state;
  }

  public set state(state: TransportState) {
    this._state = state;
  }

  get expiry(): number | undefined {
    return this._expiry;
  }

  public tracks(): Tracks {
    return { local: { audio: undefined, video: undefined } };
  }
}

export default TransportStub;
