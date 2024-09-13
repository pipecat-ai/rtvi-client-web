import { Client, VoiceMessage } from "..";

export type VoiceClientHelpers = Partial<Record<string, VoiceClientHelper>>;

export type VoiceClientHelperCallbacks = Partial<object>;

export interface VoiceClientHelperOptions {
  /**
   * Callback methods for events / messages
   */
  callbacks?: VoiceClientHelperCallbacks;
}

export abstract class VoiceClientHelper {
  protected _options: VoiceClientHelperOptions;
  protected declare _voiceClient: Client;
  protected declare _name: string;

  constructor(options: VoiceClientHelperOptions) {
    this._options = options;
  }

  public abstract handleMessage(ev: VoiceMessage): void;
  public abstract getMessageTypes(): string[];
  public set voiceClient(voiceClient: Client) {
    this._voiceClient = voiceClient;
  }
  public set name(name: string) {
    this._name = name;
  }
}
