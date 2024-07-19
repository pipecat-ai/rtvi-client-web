import { useCallback, useRef, useState } from "react";
import {
  useVoiceClient,
  useVoiceClientEvent,
  VoiceClientAudio,
} from "@realtime-ai/voice-sdk-react";
import {
  RateLimitError,
  VoiceClientConfigOptions,
  VoiceEvent,
} from "@realtime-ai/voice-sdk";

export const DemoApp = () => {
  const voiceClient = useVoiceClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isBotConnected, setIsBotConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<VoiceClientConfigOptions | undefined>(
    voiceClient?.config
  );
  const [llmContext, setLlmContext] = useState<
    { role: string; content: string }[] | undefined
  >(voiceClient?.llmContext?.messages);

  async function start() {
    try {
      await voiceClient?.start();
    } catch (e) {
      if (e instanceof RateLimitError) {
        setError("Demo is currently at capacity. Please try again later.");
      }
    }
  }

  useVoiceClientEvent(
    VoiceEvent.Connected,
    useCallback(() => {
      setIsConnected(true);
    }, [])
  );
  useVoiceClientEvent(
    VoiceEvent.Disconnected,
    useCallback(() => {
      setIsConnected(false);
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
    VoiceEvent.ConfigUpdated,
    useCallback((config: VoiceClientConfigOptions) => {
      setConfig(config);
    }, [])
  );

  return (
    <div>
      <style scoped>{`
        .participants-wrapper {
          display: flex;
          gap: 8px;
        }
        .meter-wrapper {
          align-items: center;
          display: flex;
          flex-direction: column;
          gap: 8px;
          justify-content: center;
        }
      `}</style>
      <h1>Hello Voice Client React Demo!</h1>
      {error}
      <p>
        <strong>
          Bot is {isBotConnected ? "connected" : "not connected"} (
          {voiceClient?.state})
        </strong>
      </p>
      <div className="participants-wrapper">
        <div className="meter-wrapper">
          <strong>You</strong>
          <MicMeter type={VoiceEvent.LocalAudioLevel} />
        </div>
        {isBotConnected && (
          <div className="meter-wrapper">
            <strong>Bot</strong>
            <MicMeter type={VoiceEvent.RemoteAudioLevel} />
          </div>
        )}
      </div>
      <button disabled={isConnected} onClick={() => start()}>
        Connect
      </button>
      <button disabled={!isConnected} onClick={() => voiceClient?.disconnect()}>
        Disconnect
      </button>
      <hr />
      <strong>Config:</strong>
      <textarea
        style={{ width: "100%" }}
        rows={10}
        readOnly
        value={JSON.stringify(config, null, 2)}
      />
      <hr />
      <strong>LLM Context:</strong>
      <textarea
        style={{ width: "100%" }}
        rows={10}
        defaultValue={JSON.stringify(llmContext, null, 2)}
        onChange={(e) => {
          setLlmContext(JSON.parse(e.target.value));
        }}
      />
      <button
        onClick={() => {
          voiceClient!.llmContext = {
            messages: llmContext,
          };
        }}
      >
        Update LLM context
      </button>
      <br />
      Model:
      <select
        defaultValue={voiceClient?.llmContext?.model}
        onChange={(e) => {
          voiceClient!.llmContext = { model: e.target.value };
        }}
      >
        <option value="llama3-8b-8192">llama3-8b-8192</option>
        <option value="llama3-70b-8192">llama3-70b-8192</option>
      </select>
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
