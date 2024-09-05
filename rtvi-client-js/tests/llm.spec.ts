import { describe, expect, test } from "@jest/globals";

import {
  LLMHelper,
  VoiceClient,
  type VoiceClientConfigOption,
  VoiceClientServices,
} from "../src/";
import { TransportStub } from "./transport.stub";

jest.mock("nanoid", () => {
  return {
    nanoid: 123,
  };
});

const exampleServices: VoiceClientServices = {
  tts: "tts",
  llm: "llm",
};

const exampleConfig: VoiceClientConfigOption[] = [
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

const voiceClient = new VoiceClient({
  baseUrl: "",
  transport: TransportStub,
  services: exampleServices,
  config: exampleConfig,
});

const llmHelper = new LLMHelper({});
voiceClient.registerHelper("llm", llmHelper);

describe("LLM Helper", () => {
  test("Voice client to return the LLM Helper", () => {
    expect(voiceClient.getHelper("llm")).toBe(llmHelper);
  });

  const newMessages = [
    {
      role: "system",
      content: "test",
    },
  ];

  test("getContext should return correct context", async () => {
    const context = await llmHelper.getContext();

    expect(context).toEqual(
      expect.objectContaining({
        messages: expect.arrayContaining([
          {
            role: "system",
            content:
              "You are a assistant called ExampleBot. You can ask me anything.",
          },
        ]),
      })
    );
  });

  test("setContext should update the voice client config", async () => {
    await llmHelper.setContext(
      {
        messages: newMessages,
      },
      false
    );

    expect(voiceClient.config).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: "llm",
          options: expect.arrayContaining([
            { name: "initial_messages", value: newMessages },
          ]),
        }),
      ])
    );
  });

  test("getContext to return the updated context", async () => {
    const context = await llmHelper.getContext();
    expect(context).toEqual({ messages: newMessages });
  });

  test("setContext should be able to set multiple messages", async () => {
    await llmHelper.setContext(
      {
        messages: [
          {
            role: "system",
            content: "test",
          },
          {
            role: "user",
            content: "test",
          },
        ],
      },
      false
    );

    expect(voiceClient.config).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: "llm",
          options: expect.arrayContaining([
            {
              name: "initial_messages",
              value: [
                {
                  role: "system",
                  content: "test",
                },
                {
                  role: "user",
                  content: "test",
                },
              ],
            },
          ]),
        }),
      ])
    );
  });

  test("getContext should all return messages", async () => {
    const context = await llmHelper.getContext();
    expect(context).toEqual({
      messages: [
        {
          role: "system",
          content: "test",
        },
        {
          role: "user",
          content: "test",
        },
      ],
    });
  });

  test("setContext should return a boolean", async () => {
    const result = await llmHelper.setContext(
      {
        messages: newMessages,
      },
      false
    );

    expect(result).toBe(true);
  });
});

describe("LLM Helper appendContext", () => {
  test("appendMessages should add messages to config and return true", async () => {
    const result = await llmHelper.appendToMessages({
      role: "assistant",
      content: "Appended message",
    });

    expect(voiceClient.config).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: "llm",
          options: expect.arrayContaining([
            {
              name: "initial_messages",
              value: expect.arrayContaining([
                {
                  role: "assistant",
                  content: "Appended message",
                },
              ]),
            },
          ]),
        }),
      ])
    );

    expect(result).toBe(true);
  });
});
