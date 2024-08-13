import { createRoot } from "react-dom/client";
import { PipecatMetrics, VoiceEvent, VoiceMessage } from "realtime-ai";
import { DailyVoiceClient } from "realtime-ai-daily";
import { VoiceClientProvider } from "realtime-ai-react";
import { Sandbox } from "./SandboxApp";
import { useState } from "react";

function createVoiceClient(baseUrl: string): DailyVoiceClient {
  const voiceClient = new DailyVoiceClient({
    baseUrl: import.meta.env.VITE_BASE_URL,
    services: {
      llm: "openai",
      tts: "cartesia",
    },
    config: [
      {
        service: "llm",
        options: [
          // or claude-3-5-sonnet-20240620
          { name: "model", value: "gpt-4o" },
          {
            name: "messages",
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
        console.log("[CALLBACK] JSON Completion:", jsonString);
      },
      onLLMFunctionCall: (
        functionName: string,
        toolCallId: string,
        args: any
      ) => {
        console.log("[CALLBACK] LLM Function Call:", {
          functionName,
          toolCallId,
          args,
        });
      },
      onLLMFunctionCallStart: (functionName: string) => {
        console.log("[CALLBACK] LLM Function Call Start:", { functionName });
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

  return voiceClient;
}

const App = () => {
  const [baseUrl, setBaseUrl] = useState(import.meta.env.VITE_BASE_URL);
  const [hasStarted, setHasStarted] = useState(false);
  const [voiceClient, setVoiceClient] = useState<DailyVoiceClient | null>(null);

  function start() {
    setVoiceClient(createVoiceClient(baseUrl));
    setHasStarted(true);
  }

  if (!hasStarted) {
    return (
      <div>
        <label>Base URL:</label>
        <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
        <button onClick={start}>Start</button>
      </div>
    );
  }

  return (
    <VoiceClientProvider voiceClient={voiceClient!}>
      <Sandbox />
    </VoiceClientProvider>
  );
};

const rootContainer = document.querySelector("#app") ?? document.body;

const root = createRoot(rootContainer);

root.render(<App />);
