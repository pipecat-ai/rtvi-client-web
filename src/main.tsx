import { createRoot } from "react-dom/client";
import { VoiceClient, VoiceEvent } from "./grok-voice-sdk";

import { VoiceClientProvider } from "./voice-sdk-react";
import { DemoApp } from "./DemoApp";

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
