import { createRoot } from "react-dom/client";
import {
  LLMHelper,
  PipecatMetrics,
  VoiceEvent,
  VoiceMessage,
} from "realtime-ai";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientProvider } from "realtime-ai-react";
import { Sandbox } from "./SandboxApp";

const voiceClient = new DailyVoiceClient({
  baseUrl: import.meta.env.VITE_BASE_URL,
  enableMic: true,
  services: {
    llm: "together",
    tts: "cartesia",
    stt: "deepgram",
  },
  config: [
    {
      service: "tts",
      options: [
        { name: "voice", value: "79a125e8-cd45-4c13-8a67-188112f4dd22" },
      ],
    },
    {
      service: "llm",
      options: [
        { name: "model", value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" },
        {
          name: "initial_messages",
          value: [
            {
              role: "system",
              content:
                "You are a assistant called Frankie. You can ask me anything. Keep responses brief and legible. Introduce yourself first.",
            },
          ],
        },
        { name: "run_on_config", value: true },
      ],
    },
  ],

  // OpenAI/Anthropic function calling config
  /*
      config: [
      {
        service: "llm",
        options: [
          // or claude-3-5-sonnet-20240620
          { name: "model", value: "gpt-4o" },
          {
            name: "initial_messages",
            value: [
              {
                // anthropic: user; openai: system
                role: "system",
                content:
                  "You are a cat named Clarissa. You can ask me anything. Keep response brief and legible. Start by telling me to ask for the weather in San Francisco.",
              },
            ],
          },
          // OpenAI

          {
            name: "tools",
            value: [
              {
                type: "function",
                function: {
                  name: "get_current_weather",
                  description:
                    "Get the current weather for a location. This includes the conditions as well as the temperature.",
                  parameters: {
                    type: "object",
                    properties: {
                      location: {
                        type: "string",
                        description:
                          "The city and state, e.g. San Francisco, CA",
                      },
                      format: {
                        type: "string",
                        enum: ["celsius", "fahrenheit"],
                        description:
                          "The temperature unit to use. Infer this from the users location.",
                      },
                    },
                    required: ["location", "format"],
                  },
                },
              },
            ],
          },

          // Anthropic

          // {
          //   name: "tools",
          //   value: [
          //     {
          //       name: "get_current_weather",
          //       description:
          //         "Get the current weather for a location. This includes the conditions as well as the temperature.",
          //       input_schema: {
          //         type: "object",
          //         properties: {
          //           location: {
          //             type: "string",
          //             description: "The city and state, e.g. San Francisco, CA",
          //           },
          //           format: {
          //             type: "string",
          //             enum: ["celsius", "fahrenheit"],
          //             description:
          //               "The temperature unit to use. Infer this from the users location.",
          //           },
          //         },
          //         required: ["location", "format"],
          //       },
          //     },
          //   ],
          // },
        ],
      },
    ],
    */
  timeout: 15 * 1000,
  enableCam: false,
  callbacks: {
    onMessageError: (message: VoiceMessage) => {
      console.log("[CALLBACK] Message error", message);
    },
    onError: (message: VoiceMessage) => {
      console.log("[CALLBACK] Error", message);
    },
    onGenericMessage: (data: unknown) => {
      console.log("[CALLBACK] Generic message:", data);
    },
    onConnected: () => {
      console.log("[CALLBACK] Connected");
    },
    onBotReady: () => {
      console.log("[CALLBACK] Bot ready");
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
  },
});

// Helpers
voiceClient.registerHelper(
  "llm",
  new LLMHelper({
    callbacks: {},
  })
) as LLMHelper;

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

// voiceClient.helper<LLMHelper>("llm").llmContext();

const rootContainer = document.querySelector("#app") ?? document.body;

const root = createRoot(rootContainer);

root.render(
  <VoiceClientProvider voiceClient={voiceClient}>
    <Sandbox />
  </VoiceClientProvider>
);
