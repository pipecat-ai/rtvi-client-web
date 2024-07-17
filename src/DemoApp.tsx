import { useCallback, useRef, useState } from "react";
import { useVoiceClient, useVoiceClientEvent } from "./voice-sdk-react";
import { VoiceEvent } from "./grok-voice-sdk";

export const DemoApp = () => {
  const voiceClient = useVoiceClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isBotConnected, setIsBotConnected] = useState(false);
  const botAudioRef = useRef<HTMLAudioElement>(null);

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
    VoiceEvent.TrackStarted,
    useCallback((track, p) => {
      if (p?.local || !botAudioRef.current) return;
      botAudioRef.current.srcObject = new MediaStream([track]);
      botAudioRef.current.play();
    }, [])
  );

  return (
    <div>
      <h1>Hello Voice Client React Demo!</h1>
      <p>
        <strong>Bot is {isBotConnected ? "connected" : "not connected"}</strong>
      </p>
      {isBotConnected && <BotMeter />}
      <button disabled={isConnected} onClick={() => voiceClient?.start()}>
        Connect
      </button>
      <button disabled={!isConnected} onClick={() => voiceClient?.disconnect()}>
        Disconnect
      </button>
      <audio ref={botAudioRef} autoPlay />
    </div>
  );
};

const BotMeter = () => {
  const meterRef = useRef<HTMLInputElement>(null);

  useVoiceClientEvent(
    VoiceEvent.RemoteAudioLevel,
    useCallback((level) => {
      if (!meterRef.current) return;
      meterRef.current.style.width = 100 * Math.min(1, 3 * level) + "%";
    }, [])
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
