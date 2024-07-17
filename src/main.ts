import { VoiceClient, VoiceEvent } from "./grok-voice-sdk";

const voiceClient = new VoiceClient({
  enableMic: true,
  callbacks: {
    onConnected: () => {
      console.log("[CALLBACK] Connected");
      connectBtn.disabled = true;
      disconnectBtn.disabled = false;
    },
    onDisconnected: () => {
      console.log("[CALLBACK] Disconnected");
      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
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

// Render something to the screen
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Hello I am demo
  </div>
  <button id="connect">Connect</button>
  <button id="disconnect" disabled>Disonnect</button>
  <audio id="bot-audio" autoplay></audio>
`;

const connectBtn = document.getElementById("connect") as HTMLButtonElement;
const disconnectBtn = document.getElementById(
  "disconnect"
) as HTMLButtonElement;

connectBtn?.addEventListener("click", () => {
  connectBtn.disabled = true;
  voiceClient.start();
});

disconnectBtn?.addEventListener("click", () => {
  voiceClient.disconnect();
});
