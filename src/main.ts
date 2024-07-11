import { VoiceClient } from "./grok-voice-sdk";

const voiceClient = new VoiceClient({
  apiKey: "1234",
});

await voiceClient.start();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    Hello I am demo
  </div>
`;
