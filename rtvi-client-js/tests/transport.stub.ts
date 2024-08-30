import {
  Tracks,
  Transport,
  TransportState,
  VoiceClientOptions,
  VoiceMessage,
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

  public connect(
    authBundle: unknown,
    abortController: AbortController
  ): Promise<void> {
    console.log(authBundle, abortController);
    return Promise.resolve();
  }

  public disconnect(): Promise<void> {
    return Promise.resolve();
  }
  public sendReadyMessage(): void {
    return;
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

  public sendMessage(message: VoiceMessage): void {
    console.log(message);
    return;
  }

  public get state(): TransportState {
    return "idle";
  }
  public set state(state: TransportState) {
    console.log(state);
    return;
  }

  get expiry(): number | undefined {
    return this._expiry;
  }

  public tracks(): Tracks {
    return { local: { audio: undefined, video: undefined } };
  }
}

export default TransportStub;
