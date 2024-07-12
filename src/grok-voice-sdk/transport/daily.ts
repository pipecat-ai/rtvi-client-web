import Daily, { DailyCall } from "@daily-co/daily-js";

import { Participant, Transport, VoiceEventCallbacks } from ".";

export class DailyTransport extends Transport {
  private _daily: DailyCall;

  constructor(callbacks: VoiceEventCallbacks) {
    super(callbacks);

    this._daily = Daily.createCallObject({
      videoSource: false,
      audioSource: false,
      dailyConfig: {},
    });
  }

  async connect({ url }: { url: string }) {
    this.attachEventListeners();

    try {
      await this._daily.join({ url });
    } catch (e) {
      //@TODO: Error handling here
      console.error("Failed to join call", e);
      return;
    }

    this._callbacks.onConnected?.();
  }

  private attachEventListeners() {
    this._daily.on("track-started", () => {});
    this._daily.on("track-stopped", () => {});
    this._daily.on(
      "participant-joined",
      ({ participant: { user_id, user_name, local } }) => {
        const p = { id: user_id, name: user_name, local } as Participant;

        this._callbacks.onParticipantJoined?.(p);

        if (local) return;

        this._callbacks.onBotConnected?.(p);
      }
    );
  }

  async disconnect() {
    await this._daily.leave();
    await this._daily.destroy();

    this._callbacks.onDisconnected?.();
  }
}
