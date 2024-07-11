import { VoiceClient } from "./grok-voice-sdk";
// import { StubTransport } from "./grok-voice-sdk/transport";

const voiceClient = new VoiceClient({
  enableMic: true,
  startMicMuted: false,
  // transport: StubTransport,
});

await voiceClient.start();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Hello I am demo
  </div>
`;
