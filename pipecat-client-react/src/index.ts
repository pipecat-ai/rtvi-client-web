import { RTVIClientAudio } from "./RTVIClientAudio";
import { RTVIClientVideo } from "./RTVIClientVideo";
import { RTVIClientProvider } from "./RTVIClientProvider";
import { VoiceVisualizer } from "./VoiceVisualizer";
import { useRTVIClient } from "./useRTVIClient";
import { useRTVIClientEvent } from "./useRTVIClientEvent";
import { useRTVIClientMediaDevices } from "./useRTVIClientMediaDevices";
import { useRTVIClientMediaTrack } from "./useRTVIClientMediaTrack";
import { useRTVIClientTransportState } from "./useRTVIClientTransportState";

/**
 * @deprecated Use RTVIClientAudio instead.
 */
const VoiceClientAudio = RTVIClientAudio;
/**
 * @deprecated Use RTVIClientVideo instead.
 */
const VoiceClientVideo = RTVIClientVideo;
/**
 * @deprecated Use RTVIClientProvider instead.
 */
const VoiceClientProvider = RTVIClientProvider;
/**
 * @deprecated Use useRTVIClient instead.
 */
const useVoiceClient = useRTVIClient;
/**
 * @deprecated Use useRTVIClientEvent instead.
 */
const useVoiceClientEvent = useRTVIClientEvent;
/**
 * @deprecated Use useRTVIClientMediaDevices instead.
 */
const useVoiceClientMediaDevices = useRTVIClientMediaDevices;
/**
 * @deprecated Use useRTVIClientMediaTrack instead.
 */
const useVoiceClientMediaTrack = useRTVIClientMediaTrack;
/**
 * @deprecated Use useRTVIClientTransportState instead.
 */
const useVoiceClientTransportState = useRTVIClientTransportState;

export {
  RTVIClientAudio,
  RTVIClientVideo,
  VoiceVisualizer,
  RTVIClientProvider,
  useRTVIClient,
  useRTVIClientEvent,
  useRTVIClientMediaDevices,
  useRTVIClientMediaTrack,
  useRTVIClientTransportState,
  // deprecated since 0.2.0
  VoiceClientAudio,
  VoiceClientVideo,
  VoiceClientProvider,
  useVoiceClient,
  useVoiceClientEvent,
  useVoiceClientMediaDevices,
  useVoiceClientMediaTrack,
  useVoiceClientTransportState,
};
