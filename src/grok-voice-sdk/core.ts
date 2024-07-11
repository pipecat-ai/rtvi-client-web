import { Transport } from "./transport";
import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";
import { VoiceEvent } from "./events";

export type VoiceEventCallbacks = {
  ready: () => void;
};

export abstract class APIClient extends (EventEmitter as new () => TypedEmitter<VoiceEventCallbacks>) {
  private _transport: Transport;

  constructor({ transport }: { transport: Transport }) {
    super();
    this._transport = transport;
  }

  async start() {
    console.log("Starting");
    console.log(this._transport);

    this.emit(VoiceEvent.Ready);
  }
}
