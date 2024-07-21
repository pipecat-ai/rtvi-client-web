import { createRoot } from "react-dom/client";
import { VoiceClient, VoiceEvent } from "@realtime-ai/voice-sdk";
import { VoiceClientProvider } from "@realtime-ai/voice-sdk-react";

import { DemoApp } from "./DemoApp";

const voiceClient = new VoiceClient({
  baseUrl: import.meta.env.VITE_BASE_URL,
  enableMic: true,
  callbacks: {
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
  },
  config: {
    llm: {
      model: "llama3-70b-8192",
      messages: [
        {
          role: "system",
          content:
            'You are a helpful assistant named Gary. If I say "codeword", respond with {"foo": "bar"}. Do not include any other characters in your response.',
        },
      ],
    },
    tts: {
      voice: "79a125e8-cd45-4c13-8a67-188112f4dd22",
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

const rootContainer = document.querySelector("#app") ?? document.body;

const root = createRoot(rootContainer);

root.render(
  <VoiceClientProvider voiceClient={voiceClient}>
    <DemoApp />
  </VoiceClientProvider>
);
