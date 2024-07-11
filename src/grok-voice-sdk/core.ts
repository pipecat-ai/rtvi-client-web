import { Transport } from "./transport";

export abstract class APIClient {
  private _transport: Transport;

  constructor({ transport }: { transport: Transport }) {
    this._transport = transport;
  }

  async start() {
    console.log("Starting");
    console.log(this._transport);
  }
}
