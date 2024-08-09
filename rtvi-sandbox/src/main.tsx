import { createRoot } from "react-dom/client";
import { PipecatMetrics, VoiceClient, VoiceEvent } from "realtime-ai";
import { VoiceClientProvider } from "realtime-ai-react";
import { Sandbox } from "./SandboxApp";

const voiceClient = new VoiceClient({
  baseUrl: import.meta.env.VITE_BASE_URL,
  services: {
    llm: "groq",
    tts: "cartesia",
  },
  config: [
    {
      service: "llm",
      options: [{ name: "model", value: "llama3-70b-8192" }],
    },
  ],
  timeout: 15 * 1000,
  enableMic: true,
  enableCam: false,
  callbacks: {
    onGenericMessage: (data: unknown) => {
      console.log("[CALLBACK] Generic message:", data);
    },
    onConnected: () => {
      console.log("[CALLBACK] Connected");
    },
    onDisconnected: () => {
      console.log("[CALLBACK] Disconnected");
    },
    onTransportStateChanged: (state: string) => {
      console.log("[CALLBACK] State change:", state);
    },
    onBotConnected: () => {
      console.log("[CALLBACK] Bot connected");
    },
    onBotDisconnected: () => {
      console.log("[CALLBACK] Bot disconnected");
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
    onJsonCompletion: (jsonString: string) => {
      console.log("[CALLBACK] JSON Completion: ", jsonString);
    },
    onMetrics: (data: PipecatMetrics) => {
      console.log("[CALLBACK] Metrics:", data);
    },
    /*onUserTranscript: (data: Transcript) => {
      console.log("[CALLBACK] User Transcript:", data);
    },
    onBotTranscript: (text: string) => {
      console.log("[CALLBACK] Bot Transcript:", text);
    },*/
  },
});

// Some convenience events
// These are not required, but can be useful for debugging
voiceClient.on(VoiceEvent.TransportStateChanged, (state) => {
  console.log("[EVENT] Transport state change:", state);
});
voiceClient.on(VoiceEvent.BotReady, () => {
  console.log("[EVENT] Bot is ready");
});
voiceClient.on(VoiceEvent.Connected, () => {
  console.log("[EVENT] User connected");
});
voiceClient.on(VoiceEvent.Disconnected, () => {
  console.log("[EVENT] User disconnected");
});

const rootContainer = document.querySelector("#app") ?? document.body;

const root = createRoot(rootContainer);

root.render(
  <VoiceClientProvider voiceClient={voiceClient}>
    <Sandbox />
  </VoiceClientProvider>
);
