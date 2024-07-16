import { VoiceClient, VoiceEvent } from "./grok-voice-sdk";

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
    onBotConnected: () => {
      console.log("[CALLBACK] Bot connected");
    },
    onBotStartedTalking: () => {
      console.log("[CALLBACK] Bot started talking");
    },
    onBotStoppedTalking: () => {
      console.log("[CALLBACK] Bot stopped talking");
    },
    onLocalStartedTalking: () => {
      console.log("[CALLBACK] Local started talking");
    },
    onLocalStoppedTalking: () => {
      console.log("[CALLBACK] Local stopped talking");
    },
    onTrackStarted: (track, participant) => {
      if (participant?.local || track.kind !== "audio") return;
      const audioEl = document.getElementById("bot-audio") as HTMLAudioElement;
      if (!audioEl) return;
      audioEl.srcObject = new MediaStream([track]);
      audioEl.play();
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
voiceClient.on(VoiceEvent.Connected, () => {
  console.log("[EVENT] Voice client session has started");
});
voiceClient.on(VoiceEvent.Disconnected, () => {
  console.log("[EVENT] Disconnected");
});

// Asynchronously start the voice client. This resolves when the client is connected
await voiceClient.start();

// Do cool voice stuff here
console.log("away we go");

// Leave after 3 seconds
setTimeout(async () => {
  await voiceClient.disconnect();
}, 60000);

// Render something to the screen
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Hello I am demo
  </div>
  <audio id="bot-audio" autoplay></audio>
`;
