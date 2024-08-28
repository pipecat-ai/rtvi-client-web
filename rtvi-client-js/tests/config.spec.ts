import { describe, expect, test } from "@jest/globals";

import {
  ConfigOption,
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

const voiceClient = new VoiceClient({
  baseUrl: "",
  transport: TransportStub,
  services: exampleServices,
  config: exampleConfig,
});

describe("Config typing", () => {
  test("exampleConfig should be of type VoiceClientConfigOption[]", () => {
    expect(exampleConfig).toBeInstanceOf(Array);
    expect(exampleConfig).toEqual(expect.arrayContaining([]));
    expect(exampleConfig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: expect.any(String),
          options: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              value: expect.anything(),
            }),
          ]),
        }),
      ])
    );
  });
});

describe("Voice Client Config Getter Helper Methods", () => {
  test("getServiceOptionsFromConfig should return options for a given service", () => {
    expect(voiceClient.getServiceOptionsFromConfig("vad")).toEqual({
      service: "vad",
      options: [{ name: "params", value: { stop_secs: 0.8 } }],
    });

    expect(
      voiceClient.getServiceOptionsFromConfig("llm") as VoiceClientConfigOption
    ).toHaveProperty("options");
  });

  test("getServiceOptionsFromConfig to return undefined with invalid key", () => {
    expect(voiceClient.getServiceOptionsFromConfig("test")).toBeUndefined();
  });

  test("getServiceOptionFromConfig returns a single option for a given service", () => {
    expect(voiceClient.getServiceOptionValueFromConfig("llm", "model")).toEqual(
      "ModelABC"
    );
  });

  test("getServiceOptionFromConfig returns undefined with unknown service", () => {
    expect(
      voiceClient.getServiceOptionValueFromConfig("test", "model")
    ).toBeUndefined();
  });

  test("getServiceOptionFromConfig returns undefined with unknown option name", () => {
    expect(
      voiceClient.getServiceOptionValueFromConfig("llm", "test")
    ).toBeUndefined();
  });
});

describe("Voice Client Config Setter Helper Methods", () => {
  test("setServiceOptionInConfig should change the value of a config option", () => {
    expect(
      voiceClient.setServiceOptionInConfig("llm", {
        name: "model",
        value: "NewModel",
      } as ConfigOption)
    ).toEqual([
      {
        service: "vad",
        options: [{ name: "params", value: { stop_secs: 0.8 } }],
      },
      {
        service: "tts",
        options: [{ name: "voice", value: "VoiceABC" }],
      },
      {
        service: "llm",
        options: [
          { name: "model", value: "NewModel" },
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
    ]);
  });

  test("setServiceOptionInConfig should not change the client config", () => {
    expect(
      voiceClient.setServiceOptionInConfig("llm", {
        name: "model",
        value: "NewModel",
      } as ConfigOption)
    ).not.toEqual(voiceClient.config);
  });
});
