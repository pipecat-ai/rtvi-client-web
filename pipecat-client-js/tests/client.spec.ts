/**
 * Copyright (c) 2024, Daily.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { beforeEach, describe, expect, test } from "@jest/globals";

import {
  BotNotReadyError,
  LLMHelper,
  RTVIClient,
  type RTVIClientConfigOption,
  RTVIClientOptions,
  RTVIEvent,
} from "../src/";
import { TransportStub } from "./stubs/transport";

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

  beforeEach(() => {
    const transport = new TransportStub();
    const args = {
      params: {
        baseUrl: "/",
        services: exampleServices,
        config: exampleConfig,
      },
      transport: transport,
      customConnectHandler: () => Promise.resolve(),
    };
    client = new RTVIClient(args as RTVIClientOptions);
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
      "disconnected",
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

  test("Endpoints should have defaults", () => {
    const connectUrl = client.constructUrl("connect");
    const disconnectedActionsUrl = client.constructUrl("action");

    expect(connectUrl).toEqual("/connect");
    expect(disconnectedActionsUrl).toEqual("/action");
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
