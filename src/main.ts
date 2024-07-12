import { VoiceClient, VoiceEvent } from "./grok-voice-sdk";

/*const callbacks: VoiceEventCallbacks = {
  onStateChange: (state) =>
    this.emit(VoiceEvent.TransportStateChanged, state),
};*/

const voiceClient = new VoiceClient({
  enableMic: true,
  callbacks: {
    onConnected: () => {
      console.log("[CALLBACK] Connected");
    },
    onDisconnected: () => {
      console.log("[CALLBACK] Disconnected");
    },
    onStateChange: (state: string) => {
      console.log("[CALLBACK] State change:", state);
    },
  },
});

/**
 * Note: you can override the transport type for future interoperability
 *
 * import { StubTransport } from "./grok-voice-sdk/transport";
 * const voiceClient = new VoiceClient({
 *  config: {
 *    transport: StubTransport
 *  }
 * });
 */

// Some convenience events
// These are not required, but can be useful for debugging
voiceClient.on(VoiceEvent.TransportStateChanged, (state) => {
  console.log("[EVENT] Transport state change:", state);
});

voiceClient.on(VoiceEvent.Started, () => {
  console.log("[EVENT] Voice client session has started");
});

// Asynchronously start the voice client. This resolves when the client is connected
await voiceClient.start();

// Do cool voice stuff here
console.log("away we go");

// Leave after 3 seconds
setTimeout(async () => {
  await voiceClient.disconnect();
}, 3000);

// Render something to the screen
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Hello I am demo
  </div>
`;
