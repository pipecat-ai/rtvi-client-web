import Daily, { DailyCall } from "@daily-co/daily-js";

import { Transport, VoiceEventCallbacks } from ".";

export class DailyTransport extends Transport {
  private _daily: DailyCall | null;

  constructor(callbacks: VoiceEventCallbacks) {
    super(callbacks);

    this._daily = Daily.createCallObject({
      videoSource: false,
      audioSource: false,
      dailyConfig: {},
    });
  }

  async connect({ url }: { url: string }) {
    if (!this._daily) {
      throw new Error("Daily call object not initialized");
    }

    try {
      await this._daily.join({ url });
    } catch (e) {
      //@TODO: Error handling here
      console.error("Failed to join call", e);
      return;
    }

    this._callbacks.onConnected?.();
  }

  async disconnect() {
    if (!this._daily) {
      return;
    }

    await this._daily.leave();
    await this._daily.destroy();

    this._callbacks.onDisconnected?.();
  }
}
