import { Transport } from ".";

export class StubTransport extends Transport {
  constructor() {
    super();
    console.log("StubTransport constructor");
  }
}
