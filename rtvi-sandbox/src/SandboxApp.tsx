import { useCallback, useRef, useState } from "react";
import {
  useVoiceClient,
  useVoiceClientEvent,
  useVoiceClientMediaDevices,
  useVoiceClientTransportState,
  VoiceClientAudio,
} from "realtime-ai-react";
import ReactJson from "@microlink/react-json-view";
import {
  ActionData,
  BotReadyData,
  ConnectionTimeoutError,
  FunctionCallParams,
  LLMHelper,
  Participant,
  Transcript,
  StartBotError,
  VoiceClientConfigOption,
  VoiceError,
  VoiceEvent,
} from "realtime-ai";

import styles from "./styles.module.css";

const templateAction: ActionData = {
  service: "tts",
  action: "say",
  arguments: [{ name: "text", value: "Hello, how are you?" }],
};

export const Sandbox = () => {
  const voiceClient = useVoiceClient()!;
  const state = useVoiceClientTransportState();
  const [isBotConnected, setIsBotConnected] = useState(false);
  const [botVersion, setBotVersion] = useState<string>("---");
  const { availableMics, selectedMic, updateMic } =
    useVoiceClientMediaDevices();
  const [configUpdating, setConfigUpdating] = useState(false);
  const [actionDispatching, setActionDispatching] = useState(false);
  const [configDescription, setConfigDescription] = useState<
    VoiceClientConfigOption[] | null
  >();
  const [actionsAvailable, setActionsAvailable] = useState<unknown | null>(
    null
  );
  const [config, setConfig] = useState<VoiceClientConfigOption[]>(
    voiceClient.config
  );
  const [editedConfig, setEditedConfig] = useState<unknown | null>(null);
  const [editedAction, setEditedAction] = useState<unknown | null>(
    templateAction
  );
  const [error, setError] = useState<string | null>(null);

  useVoiceClientEvent(VoiceEvent.ConfigUpdated, (e) => {
    console.log("[EVENT] Config was updated: ", e);
    setConfig(e);
  });

  useVoiceClientEvent(
    VoiceEvent.BotReady,
    useCallback(({ version }: BotReadyData) => {
      setBotVersion(version);
    }, [])
  );

  useVoiceClientEvent(VoiceEvent.ConfigDescribe, (e: unknown) => {
    console.log("[EVENT] Config description: ", e);
    setConfigDescription(e as VoiceClientConfigOption[]);
  });

  useVoiceClientEvent(VoiceEvent.ActionsAvailable, (e: unknown) => {
    console.log("[EVENT] Actions available: ", e);
    setActionsAvailable(e);
  });

  useVoiceClientEvent(
    VoiceEvent.Disconnected,
    useCallback(() => {
      setIsBotConnected(false);
    }, [])
  );
  useVoiceClientEvent(
    VoiceEvent.ParticipantConnected,
    useCallback((p: Participant) => {
      if (!p.local) setIsBotConnected(true);
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.ParticipantLeft,
    useCallback((p: Participant) => {
      if (!p.local) setIsBotConnected(false);
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.UserTranscript,
    useCallback((transcript: Transcript) => {
      if (transcript.final) {
        console.log("[EVENT] User transcript:", transcript.text);
      }
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.BotStoppedSpeaking,
    useCallback(() => {
      console.log("[EVENT] Bot stopped speaking");
    }, [])
  );

  (voiceClient.getHelper("llm") as LLMHelper).handleFunctionCall(
    async (fn: FunctionCallParams) => {
      console.log({ fn });
      return { conditions: "nice", temperature: 72 };
    }
  );

  useVoiceClientEvent(
    VoiceEvent.LLMFunctionCallStart,
    useCallback((functionName: string) => {
      console.log("!!! Function call start:", functionName);
    }, [])
  );

  async function start() {
    try {
      await voiceClient.start();
    } catch (e) {
      if (e instanceof StartBotError) {
        console.log(e.status, e.message);
        setError(e.message);
      } else if (e instanceof ConnectionTimeoutError) {
        setError(e.message);
      } else {
        setError((e as VoiceError).message || "Unknown error occured");
      }
    }
  }

  return (
    <div>
      <header className={styles.header}>
        <div>
          Client state: <strong className={styles.mono}>{state}</strong>
        </div>
        <div>
          Session expiry:{" "}
          {state === "ready" ? voiceClient.transportExpiry?.toString() : "---"}
        </div>
        <div>Bot RTVI version: {botVersion}</div>
        <div>
          {state === "connected" || state === "ready" ? (
            <button
              onClick={async () => {
                await voiceClient.disconnect();
              }}
            >
              Disconnect
            </button>
          ) : (
            <button onClick={() => start()}>Connect</button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.card}>
          <h3>Device config</h3>
          {state === "idle" ? (
            <>
              <p>Initialize to get local media devices</p>
              <button onClick={() => voiceClient.initDevices()}>
                Initialize devices
              </button>
            </>
          ) : (
            <label htmlFor="mic">
              Microphone:
              <select
                id="mic"
                onChange={(ev) => updateMic(ev.currentTarget.value)}
                value={selectedMic?.deviceId}
              >
                {availableMics.map((mic) => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className={styles.card}>
          <div>
            <strong>Local audio gain: </strong>
            <MicMeter type={VoiceEvent.LocalAudioLevel} />
          </div>
          {isBotConnected && (
            <div className="meter-wrapper">
              <strong>Bot audio gain</strong>
              <MicMeter type={VoiceEvent.RemoteAudioLevel} />
            </div>
          )}
        </div>

        <hr />

        <div className={styles.card}>
          <h3>Configuration</h3>
          <strong>Services registered</strong>
          <ul>
            {Object.entries(voiceClient.services).map(([k, v]) => (
              <li key={k.toString()}>
                {k.toString()}: {v}
              </li>
            ))}
          </ul>

          <strong>Config editor</strong>
          <ReactJson
            enableClipboard={false}
            collapsed={true}
            name="config"
            onEdit={(e) => setEditedConfig(e.updated_src)}
            onAdd={(e) => setEditedConfig(e.updated_src)}
            onDelete={(e) => setEditedConfig(e.updated_src)}
            style={{ width: "100%", fontSize: "14px" }}
            src={config}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              disabled={!editedConfig || configUpdating}
              onClick={async () => {
                setConfigUpdating(true);
                try {
                  await voiceClient.updateConfig(
                    editedConfig as VoiceClientConfigOption[]
                  );
                } catch (e) {
                  console.error("Failed to update config", e);
                }
                setConfigUpdating(false);
                setEditedConfig(null);
              }}
            >
              {configUpdating
                ? "Updating..."
                : !editedConfig
                ? "No changes to save"
                : "Save (and update if transport ready)"}
            </button>
            |
            <button
              disabled={state !== "ready"}
              onClick={async () => {
                setConfigUpdating(true);
                await voiceClient.getBotConfig();
                setConfigUpdating(false);
              }}
            >
              Fetch current bot config
            </button>
            <button
              disabled={state !== "ready"}
              onClick={() => voiceClient.describeConfig()}
            >
              Log bot config description
            </button>
          </div>
        </div>
        {configDescription && (
          <div className={styles.card}>
            <h3>Config description</h3>
            <ReactJson
              enableClipboard={true}
              name="config"
              style={{ width: "100%", fontSize: "14px" }}
              src={configDescription}
            />
          </div>
        )}

        <hr />

        <div className={styles.card}>
          <h3>Actions</h3>
          {!!actionsAvailable && (
            <ReactJson
              enableClipboard={true}
              name="config"
              style={{ width: "100%", fontSize: "14px" }}
              src={actionsAvailable as object}
            />
          )}
          <button
            disabled={state !== "ready"}
            onClick={() => voiceClient.describeActions()}
          >
            Retrieve actions available from bot
          </button>
        </div>

        <div className={styles.card}>
          <h3>Action dispatch</h3>
          <ReactJson
            enableClipboard={false}
            onDelete={(e) => setEditedAction(e.updated_src)}
            onAdd={(e) => setEditedAction(e.updated_src)}
            onEdit={(e) => setEditedAction(e.updated_src)}
            style={{ width: "100%" }}
            src={templateAction}
          />
          <button
            disabled={state !== "ready"}
            onClick={async () =>
              await voiceClient.action(editedAction as ActionData)
            }
          >
            Send action
          </button>
          <hr />

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
                const c = await llmHelper.getContext();
                console.log(c);
                setActionDispatching(false);
              }}
            >
              LLM: Get context
            </button>
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
                await llmHelper.setContext(
                  {
                    messages: [
                      {
                        role: "system",
                        content: "You are a chatbot named Frankie",
                      },
                    ],
                  },
                  true
                );
                setActionDispatching(false);
              }}
            >
              LLM: Test set context (with interrupt)
            </button>
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
                await llmHelper.appendToMessages({
                  role: "user",
                  content: "Tell me a joke!",
                });
                setActionDispatching(false);
              }}
            >
              LLM: append LLM context (no run immediately)
            </button>
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
                await llmHelper.run(true);
                setActionDispatching(false);
              }}
            >
              LLM: run inference (with interrupt)
            </button>
            |
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                await voiceClient.action({
                  service: "tts",
                  action: "say",
                  arguments: [
                    {
                      name: "text",
                      value: "You asked me to say something, so I am!",
                    },
                    {
                      name: "interrupt",
                      value: true,
                    },
                  ],
                });
                setActionDispatching(false);
              }}
            >
              TTS: Test say (with interrupt)
            </button>
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                await voiceClient.action({
                  service: "tts",
                  action: "interrupt",
                  arguments: [],
                });
                setActionDispatching(false);
              }}
            >
              TTS: Interrupt
            </button>
            |
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
                voiceClient.action({
                  service: "tts",
                  action: "say",
                  arguments: [
                    {
                      name: "text",
                      value: "You asked me to say something, so I am!",
                    },
                    {
                      name: "interrupt",
                      value: true,
                    },
                  ],
                });
                llmHelper.getContext();
              }}
            >
              Test consecutive actions
            </button>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <div>
              STT: Switch language
              <select
                disabled={state !== "ready" || actionDispatching}
                onChange={async (e) => {
                  const lang = e.target.value;
                  const model =
                    lang === "en"
                      ? "nova-2-conversationalai"
                      : "nova-2-general";
                  setActionDispatching(true);
                  await voiceClient.action({
                    service: "stt",
                    action: "switch_model",
                    arguments: [
                      {
                        name: "model",
                        value: model,
                      },
                      {
                        name: "language",
                        value: lang,
                      },
                    ],
                  });
                  setActionDispatching(false);
                }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </div>
            |
            <div>
              TTS: Switch language
              <select
                disabled={state !== "ready" || actionDispatching}
                onChange={async (e) => {
                  const model = e.target.value;
                  setActionDispatching(true);
                  await voiceClient.action({
                    service: "tts",
                    action: "switch_model",
                    arguments: [
                      {
                        name: "model",
                        value: model,
                      },
                      {
                        name: "language",
                        value: model === "sonic-english" ? "en" : "es",
                      },
                      {
                        name: "voice",
                        value:
                          model === "sonic-english"
                            ? "79a125e8-cd45-4c13-8a67-188112f4dd22"
                            : "846d6cb0-2301-48b6-9683-48f5618ea2f6",
                      },
                    ],
                  });
                  setActionDispatching(false);
                }}
              >
                <option value="sonic-english">English</option>
                <option value="sonic-multilingual">Spanish</option>
              </select>
            </div>
            |
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                await voiceClient.action({
                  service: "stt",
                  action: "switch_model",
                  arguments: [
                    {
                      name: "model",
                      value: "nova-2-general",
                    },
                    {
                      name: "language",
                      value: "es",
                    },
                  ],
                });

                await voiceClient.action({
                  service: "tts",
                  action: "switch_model",
                  arguments: [
                    {
                      name: "model",
                      value: "sonic-multilingual",
                    },
                    {
                      name: "language",
                      value: "es",
                    },
                    {
                      name: "voice",
                      value: "846d6cb0-2301-48b6-9683-48f5618ea2f6",
                    },
                  ],
                });

                const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
                await llmHelper.setContext(
                  {
                    messages: [
                      {
                        role: "system",
                        content:
                          "You are a chatbot named Frankie. Speak to me in only Spanish.",
                      },
                    ],
                  },
                  true
                );
                setActionDispatching(false);
              }}
            >
              Switch all to Spanish (and update context)
            </button>
            <button
              disabled={state !== "ready" || actionDispatching}
              onClick={async () => {
                setActionDispatching(true);
                await voiceClient.action({
                  service: "stt",
                  action: "switch_model",
                  arguments: [
                    {
                      name: "model",
                      value: "nova-2-conversationalai",
                    },
                    {
                      name: "language",
                      value: "en",
                    },
                  ],
                });

                await voiceClient.action({
                  service: "tts",
                  action: "switch_model",
                  arguments: [
                    {
                      name: "model",
                      value: "sonic-english",
                    },
                    {
                      name: "language",
                      value: "en",
                    },
                    {
                      name: "voice",
                      value: "79a125e8-cd45-4c13-8a67-188112f4dd22",
                    },
                  ],
                });

                const llmHelper = voiceClient.getHelper("llm") as LLMHelper;
                await llmHelper.setContext(
                  {
                    messages: [
                      {
                        role: "system",
                        content:
                          "You are a chatbot named Frankie. Speak to me in only English.",
                      },
                    ],
                  },
                  true
                );
                setActionDispatching(false);
              }}
            >
              Switch all to English (and update context)
            </button>
          </div>
        </div>
      </main>
      <VoiceClientAudio />
    </div>
  );
};

type MeterType = VoiceEvent.LocalAudioLevel | VoiceEvent.RemoteAudioLevel;

interface MeterProps {
  type: MeterType;
}

const MicMeter: React.FC<MeterProps> = ({ type }) => {
  const meterRef = useRef<HTMLInputElement>(null);

  useVoiceClientEvent(
    type,
    useCallback((level: number) => {
      if (!meterRef.current) return;
      meterRef.current.style.width = 100 * Math.min(1, 3 * level) + "%";
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.Disconnected,
    useCallback(() => {
      if (!meterRef.current) return;
      meterRef.current.style.width = "";
    }, [type])
  );

  return (
    <div
      style={{
        background: "#fafafa",
        height: "4px",
        margin: "20px 0",
        position: "relative",
        width: "150px",
      }}
    >
      <div
        ref={meterRef}
        style={{
          background: "blue",
          borderRadius: "4px",
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          transition: "width 100ms ease",
        }}
      />
    </div>
  );
};
