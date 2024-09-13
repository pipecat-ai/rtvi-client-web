import { describe, expect, test } from "@jest/globals";

import {
  BotNotReadyError,
  ConfigOption,
  VoiceClient,
  type VoiceClientConfigOption,
  VoiceClientServices,
  VoiceEvent,
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

describe("Voice Client Config Methods", () => {
  let voiceClient: VoiceClient;
  let voiceClientArgs = {
    baseUrl: "",
    transport: TransportStub,
    services: exampleServices,
    config: exampleConfig,
    customAuthHandler: () => Promise.resolve(),
  };

  beforeEach(() => {
    voiceClient = new VoiceClient(voiceClientArgs);
  });

  test("updateConfig should throw an error outside of runtime", () => {
    expect(() => voiceClient.updateConfig(exampleConfig)).toThrowError(
      BotNotReadyError
    );
  });

  test("getConfig should throw an error outside of runtime", () => {
    expect(() => voiceClient.getConfig()).toThrowError(BotNotReadyError);
  });

  test("describeConfig should throw an error outside of runtime", () => {
    expect(() => voiceClient.describeConfig()).toThrowError(BotNotReadyError);
  });

  describe("Runtime updateConfig Methods", () => {
    test("updateConfig should return a promise at runtime", async () => {
      await voiceClient.start();
      expect(voiceClient.updateConfig(exampleConfig)).toBeInstanceOf(Promise);
    });

    test("updateConfig should return updated config when awaited", async () => {
      await voiceClient.start();

      await expect(voiceClient.updateConfig(exampleConfig)).resolves.toEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            config: expect.arrayContaining(exampleConfig),
          }),
        })
      );
    });

    test("updateConfig should call the onConfig callback", async () => {
      const onConfigUpdatedMock = jest.fn();
      const voiceClientWithCallback = new VoiceClient({
        ...voiceClientArgs,
        callbacks: {
          onConfig: onConfigUpdatedMock,
        },
      });
      await voiceClientWithCallback.start();
      await voiceClientWithCallback.updateConfig(exampleConfig);

      expect(onConfigUpdatedMock).toHaveBeenCalledWith(exampleConfig);
    });

    test("updateConfig should call the VoiceEvents.ConfigUpdated event", async () => {
      const onMessageMock = jest.fn();

      voiceClient.on(VoiceEvent.Config, onMessageMock);

      await voiceClient.start();
      await voiceClient.updateConfig(exampleConfig);

      expect(onMessageMock).toHaveBeenCalled();

      voiceClient.off(VoiceEvent.Config, onMessageMock);
    });
  });

  describe("Runtime getConfig Methods", () => {
    test("getConfig should return a promise at runtime", async () => {
      await voiceClient.start();
      expect(voiceClient.getConfig()).toBeInstanceOf(Promise);
    });

    test("getConfig should return config when awaited", async () => {
      await voiceClient.start();

      await expect(voiceClient.getConfig()).resolves.toEqual(exampleConfig);
    });

    test("getConfig should call the onConfig callback", async () => {
      const onConfigMock = jest.fn();
      const voiceClientWithCallback = new VoiceClient({
        ...voiceClientArgs,
        callbacks: {
          onConfig: onConfigMock,
        },
      });
      await voiceClientWithCallback.start();
      await voiceClientWithCallback.getConfig();

      expect(onConfigMock).toHaveBeenCalledWith(exampleConfig);
    });

    test("getConfig should call the VoiceEvents.Config event", async () => {
      const onMessageMock = jest.fn();

      voiceClient.on(VoiceEvent.Config, onMessageMock);

      await voiceClient.start();
      await voiceClient.getConfig();

      expect(onMessageMock).toHaveBeenCalled();

      voiceClient.off(VoiceEvent.Config, onMessageMock);
    });
  });

  describe("getServiceOptionsFromConfig helper method", () => {
    test("should throw error without passed config when offline", async () => {
      await expect(
        voiceClient.getServiceOptionsFromConfig("vad")
      ).rejects.toThrow(BotNotReadyError);
    });

    test("should return undefined if serviceKey is not provided", async () => {
      const result = await voiceClient.getServiceOptionsFromConfig(
        "",
        exampleConfig
      );
      expect(result).toBeUndefined();
    });

    test("should return options for a given service with passed config", async () => {
      expect(
        await voiceClient.getServiceOptionsFromConfig("vad", exampleConfig)
      ).toEqual({
        service: "vad",
        options: [{ name: "params", value: { stop_secs: 0.8 } }],
      });
    });

    test("should return undefined with invalid key with passed config", async () => {
      expect(
        await voiceClient.getServiceOptionsFromConfig("test", exampleConfig)
      ).toBeUndefined();
    });

    test("should return options for a given service at runtime", async () => {
      await voiceClient.start();
      expect(await voiceClient.getServiceOptionsFromConfig("vad")).toEqual({
        service: "vad",
        options: [{ name: "params", value: { stop_secs: 0.8 } }],
      });
      expect(
        await voiceClient.getServiceOptionsFromConfig("test")
      ).toBeUndefined();
    });
  });

  describe("getServiceOptionValueFromConfig helper method", () => {
    test("should throw error without passed config when offline", async () => {
      await expect(
        voiceClient.getServiceOptionValueFromConfig("llm", "model")
      ).rejects.toThrow(BotNotReadyError);
    });

    test("should a single option for a given service with passed config", async () => {
      expect(
        await voiceClient.getServiceOptionValueFromConfig(
          "llm",
          "model",
          exampleConfig
        )
      ).toEqual("ModelABC");
    });

    test("should undefined with unknown service with passed config", async () => {
      expect(
        await voiceClient.getServiceOptionValueFromConfig(
          "test",
          "model",
          exampleConfig
        )
      ).toBeUndefined();
    });

    test("should returns undefined with unknown option name with passed config", async () => {
      expect(
        await voiceClient.getServiceOptionValueFromConfig(
          "llm",
          "test",
          exampleConfig
        )
      ).toBeUndefined();
    });

    test("should pass same tests at runtime (without config)", async () => {
      await voiceClient.start();
      expect(
        await voiceClient.getServiceOptionValueFromConfig("llm", "model")
      ).toEqual("ModelABC");
      expect(
        await voiceClient.getServiceOptionValueFromConfig("llm", "test")
      ).toBeUndefined();
      expect(
        await voiceClient.getServiceOptionValueFromConfig("test", "test")
      ).toBeUndefined();
    });
  });

  describe("setServiceOptionInConfig config setter helper method", () => {
    test("should throw error without passed config when offline", async () => {
      await expect(
        voiceClient.setServiceOptionInConfig("llm", {
          name: "test",
          value: "test",
        } as ConfigOption)
      ).rejects.toThrow(BotNotReadyError);
    });

    test("should return initial config with unknown service key", async () => {
      expect(
        await voiceClient.setServiceOptionInConfig(
          "test",
          {
            name: "test",
            value: "test",
          } as ConfigOption,
          exampleConfig
        )
      ).toEqual(exampleConfig);
    });

    test("should create a new service option key when it is not found", async () => {
      await voiceClient.start();

      const updatedConfig = await voiceClient.setServiceOptionInConfig("tts", {
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
    });

    test("should return new instance of passed config with changes", async () => {
      const updatedConfig = await voiceClient.setServiceOptionInConfig(
        "tts",
        {
          name: "test",
          value: "test",
        } as ConfigOption,
        exampleConfig
      );

      expect(updatedConfig).not.toEqual(exampleConfig);
    });

    test("should set or update multiple items (runtime and passed config)", async () => {
      // Passed config
      const passedConfig = await voiceClient.setServiceOptionInConfig(
        "llm",
        [
          {
            name: "model",
            value: "newModel",
          } as ConfigOption,
          {
            name: "test2",
            value: "test2",
          } as ConfigOption,
        ],
        exampleConfig
      );
      expect(passedConfig).toEqual(
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

      await voiceClient.start();

      // Runtime config
      const runtimeConfig = await voiceClient.setServiceOptionInConfig("llm", [
        {
          name: "model",
          value: "newModel",
        } as ConfigOption,
        {
          name: "test2",
          value: "test2",
        } as ConfigOption,
      ]);
      expect(runtimeConfig).toEqual(
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
  });

  describe("setConfigOptions config setter helper method", () => {
    test("should update multiple service options and return mutated object with passed config", async () => {
      const newConfig = await voiceClient.setConfigOptions(
        [
          { service: "llm", options: [{ name: "model", value: "NewModel" }] },
          { service: "tts", options: [{ name: "test", value: "test" }] },
        ],
        exampleConfig
      );

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

    test("should update multiple service options and return mutated object at runtime", async () => {
      await voiceClient.start();

      const newConfig = await voiceClient.setConfigOptions([
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
});
