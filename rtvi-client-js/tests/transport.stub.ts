import {
  Tracks,
  Transport,
  TransportState,
  VoiceClientOptions,
  VoiceMessage,
  VoiceMessageType,
} from "../src";

export class TransportStub extends Transport {
  constructor(
    options: VoiceClientOptions,
    onMessage: (ev: VoiceMessage) => void
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
          type: VoiceMessageType.BOT_READY,
          data: {
            config: this._options.config,
          },
        } as VoiceMessage);
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

  public sendMessage(message: VoiceMessage) {
    if (message.type === VoiceMessageType.ACTION) {
      this._onMessage({
        type: VoiceMessageType.ACTION_RESPONSE,
        id: "123",
        label: "rtvi-ai",
        data: {
          result: true,
        },
      });
    } else {
      this._onMessage({
        type: VoiceMessageType.ACTIONS_AVAILABLE,
        id: "123",
        label: "rtvi-ai",
        data: "test",
      });
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
