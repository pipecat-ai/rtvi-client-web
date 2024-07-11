import { VoiceClient, VoiceEvent } from "./grok-voice-sdk";
// import { StubTransport } from "./grok-voice-sdk/transport";

const voiceClient = new VoiceClient({
  enableMic: true,
  startMicMuted: false,
  // transport: StubTransport,
});

voiceClient.on(VoiceEvent.Ready, () => {
  console.log("READY");
});

await voiceClient.start();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Hello I am demo
  </div>
`;
