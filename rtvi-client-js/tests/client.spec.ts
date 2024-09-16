import { describe, expect, test } from "@jest/globals";

import {
  BotNotReadyError,
  LLMHelper,
  VoiceClient,
  type RTVIClientConfigOption,
} from "../src/";
import { TransportStub } from "./transport.stub";

jest.mock("nanoid", () => {
  return {
    nanoid: () => "123",
  };
});

const exampleServices = {
  tts: "tts",
  llm: "llm",
  vad: "vad",
};

const exampleConfig: RTVIClientConfigOption[] = [
  { service: "vad", options: [{ name: "params", value: { stop_secs: 0.8 } }] },
  {
    service: "tts",
    options: [{ name: "voice", value: "VoiceABC" }],
  },
  {
    service: "llm",
    options: [
      { name: "model", value: "ModelABC" },
      {
        name: "initial_messages",
        value: [
          {
            role: "system",
            content:
              "You are a assistant called ExampleBot. You can ask me anything.",
          },
        ],
      },
      { name: "run_on_config", value: true },
    ],
  },
];

describe("Voice Client Methods", () => {
  let voiceClient: VoiceClient;
  let voiceClientArgs = {
    baseUrl: "",
    transport: TransportStub,
    startParams: {
      services: exampleServices,
      config: exampleConfig,
    },
    customAuthHandler: () => Promise.resolve(),
  };

  beforeEach(() => {
    voiceClient = new VoiceClient(voiceClientArgs);
  });

  test("transportExpiry should throw an error when not in connected state", () => {
    expect(() => voiceClient.transportExpiry).toThrowError(BotNotReadyError);
  });

  test("transportExpiry should return value when in connected state", async () => {
    await voiceClient.start();
    expect(voiceClient.transportExpiry).toBeUndefined();
  });

  test("registerHelper should register a new helper with the specified name", async () => {
    const llmHelper = new LLMHelper({ callbacks: {} });
    voiceClient.registerHelper("llm", llmHelper);
    expect(voiceClient.getHelper("llm")).not.toBeUndefined();
    voiceClient.unregisterHelper("llm");
    expect(voiceClient.getHelper("llm")).toBeUndefined();
  });
});
