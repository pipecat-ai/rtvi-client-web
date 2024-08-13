import { createRoot } from "react-dom/client";
import { PipecatMetrics, VoiceEvent, VoiceMessage } from "realtime-ai";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientProvider } from "realtime-ai-react";
import { Sandbox } from "./SandboxApp";

const voiceClient = new DailyVoiceClient({
  baseUrl: import.meta.env.VITE_BASE_URL,
  enableMic: true,
  services: {
    llm: "together",
    tts: "cartesia",
  },
  config: [
    {
      service: "llm",
      options: [
        { name: "model", value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" },
        {
          name: "messages",
          value: [
            {
              role: "system",
              content:
                "You are a assistant called ExampleBot. You can ask me anything. Keep responses brief and legible. Introduce yourself first.",
            },
          ],
        },
      ],
    },
    {
      service: "tts",
      options: [
        { name: "voice", value: "79a125e8-cd45-4c13-8a67-188112f4dd22" },
      ],
    },
  ],
  timeout: 15 * 1000,
  enableCam: false,
  callbacks: {
    onMessageError: (message: VoiceMessage) => {
      console.log("[CALLBACK] Message error", message);
    },
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
    onBotStartedSpeaking: () => {
      console.log("[CALLBACK] Bot started talking");
    },
    onBotStoppedSpeaking: () => {
      console.log("[CALLBACK] Bot stopped talking");
    },
    onUserStartedSpeaking: () => {
      console.log("[CALLBACK] Local started talking");
    },
    onUserStoppedSpeaking: () => {
      console.log("[CALLBACK] Local stopped talking");
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
