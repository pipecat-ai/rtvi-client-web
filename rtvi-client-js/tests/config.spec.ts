import { describe, expect, test } from "@jest/globals";

import {
  ConfigOption,
  LLMContextMessage,
  VoiceClient,
  type VoiceClientConfigOption,
  VoiceClientServices,
  VoiceEvent,
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

  test("getServiceOptionsFromConfig should return a new instance of service config", () => {
    let value: VoiceClientConfigOption =
      voiceClient.getServiceOptionsFromConfig("llm") as VoiceClientConfigOption;

    const messages = value.options[1].value as LLMContextMessage[];
    messages[0].content = "test";

    expect(
      voiceClient.getServiceOptionValueFromConfig("llm", "initial_messages")
    ).toEqual(
      expect.arrayContaining([
        {
          role: "system",
          content:
            "You are a assistant called ExampleBot. You can ask me anything.",
        },
      ])
    );
  });

  test("getServiceOptionFromConfig should return a new instance of config option", () => {
    let value: LLMContextMessage[] =
      voiceClient.getServiceOptionValueFromConfig(
        "llm",
        "initial_messages"
      ) as LLMContextMessage[];

    value[0].content = "test";

    expect(
      voiceClient.getServiceOptionValueFromConfig("llm", "initial_messages")
    ).toEqual(
      expect.arrayContaining([
        {
          role: "system",
          content:
            "You are a assistant called ExampleBot. You can ask me anything.",
        },
      ])
    );
  });
});

describe("Voice Client Config Setter Helper Methods", () => {
  test("setServiceOptionInConfig should not mutate client config", () => {
    expect(
      voiceClient.setServiceOptionInConfig("llm", {
        name: "model",
        value: "NewModel",
      } as ConfigOption)
    ).not.toEqual(voiceClient.config);
  });

  test("setServiceOptionInConfig should create a new service option key when it is not found", () => {
    const updatedConfig = voiceClient.setServiceOptionInConfig("tts", {
      name: "test",
      value: "test",
    } as ConfigOption);

    expect(updatedConfig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: "tts",
          options: expect.arrayContaining([
            { name: "voice", value: "VoiceABC" },
            { name: "test", value: "test" },
          ]),
        }),
      ])
    );

    expect(
      voiceClient.setServiceOptionInConfig("llm", {
        name: "model",
        value: "NewModel",
      } as ConfigOption)
    ).not.toEqual(voiceClient.config);
  });

  test("setServiceOptionInConfig should return client config with invalid service key", () => {
    expect(
      voiceClient.setServiceOptionInConfig("test", {
        name: "test",
        value: "test",
      } as ConfigOption)
    ).toEqual(voiceClient.config);
  });

  test("setServiceOptionInConfig should set or update multiple items", () => {
    const newConfig = voiceClient.setServiceOptionInConfig("llm", [
      {
        name: "model",
        value: "newModel",
      } as ConfigOption,
      {
        name: "test2",
        value: "test2",
      } as ConfigOption,
    ]);
    expect(newConfig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: "llm",
          options: expect.arrayContaining([
            { name: "model", value: "newModel" },
            { name: "test2", value: "test2" },
          ]),
        }),
      ])
    );
  });

  test("setServiceOptionInConfig should not mutate client config when passed array", () => {
    expect(
      voiceClient.setServiceOptionInConfig("llm", [
        {
          name: "test1",
          value: "test1",
        } as ConfigOption,
        {
          name: "test2",
          value: "test2",
        } as ConfigOption,
      ])
    ).not.toEqual(voiceClient.config);
  });

  test("setServiceOptionInConfig should update the passed config when provided", () => {
    const testConfig: VoiceClientConfigOption[] = [
      { service: "llm", options: [{ name: "test", value: "test" }] },
      {
        service: "tts",
        options: [{ name: "test2", value: "test2" }],
      },
    ];
    const mutatedConfig = voiceClient.setServiceOptionInConfig(
      "llm",
      {
        name: "test",
        value: "newTest",
      } as ConfigOption,
      testConfig
    );

    expect(mutatedConfig).toEqual([
      {
        service: "llm",
        options: [{ name: "test", value: "newTest" }],
      },
      {
        service: "tts",
        options: [{ name: "test2", value: "test2" }],
      },
    ]);

    expect(mutatedConfig).not.toEqual(voiceClient.config);
  });

  test("setConfigOptions update multiple service options and returns mutated object", () => {
    const newConfig = voiceClient.setConfigOptions([
      { service: "llm", options: [{ name: "model", value: "NewModel" }] },
      { service: "tts", options: [{ name: "test", value: "test" }] },
    ]);

    expect(newConfig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: "llm",
          options: expect.arrayContaining([
            { name: "model", value: "NewModel" },
            { name: "run_on_config", value: true },
          ]),
        }),
        expect.objectContaining({
          service: "tts",
          options: expect.arrayContaining([{ name: "test", value: "test" }]),
        }),
      ])
    );
  });
});

describe("updateConfig method", () => {
  test("Config cannot be set as a property", () => {
    // Check if voiceClient has the config property
    expect("config" in voiceClient).toBe(true);

    expect(() => {
      //@ts-expect-error config is protected
      voiceClient.config = [];
    }).toThrowError();
  });

  test("updateConfig method should update the config", () => {
    const newConfig = voiceClient.setServiceOptionInConfig("tts", {
      name: "test",
      value: "test",
    } as ConfigOption);

    voiceClient.updateConfig(newConfig);

    expect(newConfig).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service: "tts",
          options: expect.arrayContaining([{ name: "test", value: "test" }]),
        }),
      ])
    );
  });

  test("updateConfig should trigger onConfigUpdate event", async () => {
    const newConfig = voiceClient.setServiceOptionInConfig("tts", {
      name: "test",
      value: "test2",
    } as ConfigOption);

    const handleConfigUpdate = (updatedConfig: VoiceClientConfigOption[]) => {
      expect(updatedConfig).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            service: "tts",
            options: expect.arrayContaining([{ name: "test", value: "test2" }]),
          }),
        ])
      );
    };
    voiceClient.on(VoiceEvent.ConfigUpdated, handleConfigUpdate);

    await voiceClient.updateConfig(newConfig);

    voiceClient.off(VoiceEvent.ConfigUpdated, handleConfigUpdate);
  });
});
