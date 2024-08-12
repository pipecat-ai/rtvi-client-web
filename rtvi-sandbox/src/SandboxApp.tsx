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
  RateLimitError,
  TransportAuthBundleError,
  VoiceClientConfigOption,
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

  useVoiceClientEvent(VoiceEvent.ConfigDescribe, (e) => {
    console.log("[EVENT] Config description: ", e);
  });

  useVoiceClientEvent(
    VoiceEvent.Disconnected,
    useCallback(() => {
      setIsBotConnected(false);
    }, [])
  );
  useVoiceClientEvent(
    VoiceEvent.ParticipantConnected,
    useCallback((p) => {
      if (!p.local) setIsBotConnected(true);
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.ParticipantLeft,
    useCallback((p) => {
      if (!p.local) setIsBotConnected(false);
    }, [])
  );

  useVoiceClientEvent(
    VoiceEvent.LLMFunctionCall,
    useCallback((functionName: string, toolCallId: string, args: any) => {
      // TODO-CB: Should something in RTVI/daily handle this return?
      console.log("!!! function call received in the app!", {
        functionName,
        toolCallId,
        args,
      });
      // TODO-CB: Should the LLM processor do this by pushing a frame upstream?
      const functionCall = {
        role: "assistant",
        tool_calls: [
          {
            id: toolCallId,
            function: { name: functionName, arguments: JSON.stringify(args) },
            type: "function",
          },
        ],
      };
      const functionResponse = {
        role: "tool",
        tool_call_id: toolCallId,
        content: JSON.stringify({ conditions: "nice", temperature: 72 }),
      };
      voiceClient.action({
        service: "llm",
        action: "append-context",
        arguments: [
          { name: "messages", value: [functionCall, functionResponse] },
        ],
      });
    }, [])
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
      if (e instanceof RateLimitError) {
        setError("Demo is currently at capacity. Please try again later.");
      } else if (e instanceof TransportAuthBundleError) {
        setError(e.message);
      } else if (e instanceof ConnectionTimeoutError) {
        setError(e.message);
      } else {
        setError("Unknown error occurred");
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
            <button onClick={() => voiceClient.disconnect()}>Disconnect</button>
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

        <div className={styles.card}>
          <h3>Configuration</h3>
          <strong>Services</strong>
          <ul>
            {Object.entries(voiceClient.services).map(([k, v]) => (
              <li key={k.toString()}>
                {k.toString()}: {v}
              </li>
            ))}
          </ul>

          <strong>Config</strong>
          <ReactJson
            enableClipboard={false}
            onEdit={(e) => setEditedConfig(e.updated_src)}
            onAdd={(e) => setEditedConfig(e.updated_src)}
            style={{ width: "100%" }}
            src={config}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              disabled={!editedConfig || configUpdating}
              onClick={async () => {
                setConfigUpdating(true);
                await voiceClient.updateConfig(
                  editedConfig as VoiceClientConfigOption[]
                );
                setConfigUpdating(false);
                setEditedConfig(null);
              }}
            >
              {configUpdating
                ? "Updating..."
                : "Save (and update if transport ready)"}
            </button>
            <button
              disabled={state !== "ready"}
              onClick={() => voiceClient.getBotConfig()}
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

        <div className={styles.card}>
          <h3>Actions</h3>
          <button
            disabled={state !== "ready"}
            onClick={() => voiceClient.describeActions()}
          >
            Log available actions
          </button>
        </div>

        <div className={styles.card}>
          <h3>Action dispatch</h3>
          <ReactJson
            enableClipboard={false}
            onEdit={(e) => setEditedAction(e.updated_src)}
            style={{ width: "100%" }}
            src={templateAction}
          />
          <button
            disabled={state !== "ready"}
            onClick={() => voiceClient.action(editedAction as ActionData)}
          >
            Send action
          </button>
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
