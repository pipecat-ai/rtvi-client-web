import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import {
  BotNotReadyError,
  LLMHelper,
  RTVIClient,
  type RTVIClientConfigOption,
  RTVIClientOptions,
  RTVIEvent,
  TransportStartError,
} from "../src/";
import { TransportStub } from "./stubs/transport";

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

describe("RTVIClient Methods", () => {
  let client: RTVIClient;
  let clientArgs: RTVIClientOptions = {
    params: {
      baseUrl: "/",
      services: exampleServices,
      config: exampleConfig,
    },
    transport: TransportStub,
    customAuthHandler: () => Promise.resolve(),
  };

  beforeEach(() => {
    client = new RTVIClient(clientArgs);
  });

  test("connect() and disconnect()", async () => {
    const stateChanges: string[] = [];
    const mockStateChangeHandler = (newState: string) => {
      stateChanges.push(newState);
    };
    client.on(RTVIEvent.TransportStateChanged, mockStateChangeHandler);

    expect(client.connected).toBe(false);

    await client.connect();

    expect(client.connected).toBe(true);
    expect(client.state === "ready").toBe(true);

    await client.disconnect();

    expect(client.connected).toBe(false);
    expect(client.state === "disconnected").toBe(true);

    expect(stateChanges).toEqual([
      "initializing",
      "initialized",
      "authenticating",
      "connecting",
      "connected",
      "ready",
      "disconnecting",
    ]);
  });

  test("initDevices() sets initialized state", async () => {
    const stateChanges: string[] = [];
    const mockStateChangeHandler = (newState: string) => {
      stateChanges.push(newState);
    };
    client.on(RTVIEvent.TransportStateChanged, mockStateChangeHandler);

    await client.initDevices();

    expect(client.state === "initialized").toBe(true);

    expect(stateChanges).toEqual(["initializing", "initialized"]);
  });

  test("client state to be error when unable to connect", async () => {
    clientArgs.params.baseUrl = "bad-url";
    let error: TransportStartError;
    try {
      await client.connect();
    } catch (e) {
      error = e as TransportStartError;
    }
    expect(client.connected).toBe(false);
    expect(() => error.message).toBeDefined();
    expect(client.state === "error").toBe(true);

    clientArgs.params.baseUrl = "/";
  });

  test("transportExpiry should throw an error when not in connected state", () => {
    expect(() => client.transportExpiry).toThrowError(BotNotReadyError);
  });

  test("transportExpiry should return value when in connected state", async () => {
    await client.connect();
    expect(client.transportExpiry).toBeUndefined();
  });

  test("registerHelper should register a new helper with the specified name", async () => {
    const llmHelper = new LLMHelper({ callbacks: {} });
    client.registerHelper("llm", llmHelper);
    expect(client.getHelper("llm")).not.toBeUndefined();
    client.unregisterHelper("llm");
    expect(client.getHelper("llm")).toBeUndefined();
  });
});
