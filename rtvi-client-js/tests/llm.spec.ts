import { describe, expect, test } from "@jest/globals";

import {
  BotNotReadyError,
  LLMHelper,
  VoiceClient,
  type VoiceClientConfigOption,
  VoiceClientServices,
} from "../src/";
import { TransportStub } from "./transport.stub";

jest.mock("nanoid", () => {
  return {
    nanoid: () => "123",
  };
});

const exampleServices: VoiceClientServices = {
  tts: "tts",
  llm: "llm",
  vad: "vad",
};

const exampleConfig: VoiceClientConfigOption[] = [
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

describe("LLM Helper Methods", () => {
  let voiceClient: VoiceClient;
  let voiceClientArgs = {
    baseUrl: "",
    transport: TransportStub,
    services: exampleServices,
    config: exampleConfig,
    customAuthHandler: () => Promise.resolve(),
  };

  const llmHelper = new LLMHelper({});

  beforeEach(() => {
    voiceClient = new VoiceClient(voiceClientArgs);
    voiceClient.registerHelper("llm", llmHelper);
  });

  describe("getContext", () => {
    test("should return error when not in ready state", async () => {
      expect(async () => await llmHelper.getContext()).rejects.toThrowError(
        BotNotReadyError
      );
    });

    test("should return context bot config", async () => {
      // Note: illustrative for stub, real world would return context
      await voiceClient.start();
      expect(await llmHelper.getContext()).toEqual(true);
    });
  });

  describe("setContext", () => {
    test("should dispatch set context action at runtime", async () => {
      await voiceClient.start();
      const result = await llmHelper.setContext(
        {
          messages: [
            {
              role: "system",
              content: "test",
            },
          ],
        },
        false
      );
      expect(result).toEqual(true);
    });
  });
});
