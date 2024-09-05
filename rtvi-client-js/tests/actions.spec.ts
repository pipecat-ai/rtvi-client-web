import { describe, expect, test } from "@jest/globals";

import {
  type VoiceMessageActionResponse,
  ActionData,
  VoiceClient,
  type VoiceClientConfigOption,
  VoiceClientServices,
  VoiceMessage,
  VoiceMessageType,
  VoiceEvent,
  MessageDispatcher,
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
  customAuthHandler: () => Promise.resolve(),
});

describe("Action and Message Dispatch", () => {
  test("Starting should resolve transport state to ready", async () => {
    await voiceClient.start();

    expect(voiceClient.state).toBe("ready");
  });

  test("Action dispatch should return VoiceMessageActionResponse", async () => {
    const response: VoiceMessageActionResponse = await voiceClient.action({
      service: "test",
      action: "test",
    } as ActionData);
    expect(response).toEqual({
      id: "123",
      label: "rtvi-ai",
      type: "action-response",
      data: { result: true },
    });
  });

  test("Message dispatch should return VoiceMessage", async () => {
    voiceClient.on(VoiceEvent.ActionsAvailable, (message) => {
      expect(message).toEqual("test");
    });
    voiceClient.sendMessage(
      new VoiceMessage(VoiceMessageType.DESCRIBE_ACTIONS, {})
    );
  });
});

describe("Message Dispatcher", () => {
  //@ts-expect-error - private method
  const messageDispatcher = new MessageDispatcher(voiceClient._transport);

  test("Resolving message removes it from the queue", async () => {
    const message = new VoiceMessage("test", {});

    messageDispatcher.dispatch(message);

    //@ts-expect-error - private method
    expect(messageDispatcher._queue.length).toBe(1);

    messageDispatcher.resolve(message);

    //@ts-expect-error - private method
    expect(messageDispatcher._queue.length).toBe(0);
  });
});
