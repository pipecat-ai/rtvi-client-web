import Daily, { DailyCall } from "@daily-co/daily-js";

import { Transport } from ".";
//import { VoiceEventCallbacks } from "../core";

export class DailyTransport implements Transport {
  private _daily: DailyCall | null;

  constructor() {
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

    // Add event listeners here...

    //onConnected?.();
    //onStateChange?.(TransportState.Connected);
  }

  async disconnect() {
    if (!this._daily) {
      return;
    }

    await this._daily.leave();
    await this._daily.destroy();
  }
}
