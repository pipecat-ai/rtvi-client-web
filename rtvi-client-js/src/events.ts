import { RTVIClientConfigOption } from ".";
import { LLMFunctionCallData } from "./helpers/llm";
import {
  BotReadyData,
  PipecatMetricsData,
  RTVIMessage,
  TranscriptData,
} from "./messages";
import { Participant, TransportState } from "./transport";

export enum RTVIEvent {
  MessageError = "messageError",
  Error = "error",

  Connected = "connected",
  Disconnected = "disconnected",
  TransportStateChanged = "transportStateChanged",

  Config = "config",
  ConfigDescribe = "configDescribe",
  ActionsAvailable = "actionsAvailable",

  ParticipantConnected = "participantConnected",
  ParticipantLeft = "participantLeft",
  TrackStarted = "trackStarted",
  TrackedStopped = "trackStopped",

  AvailableCamsUpdated = "availableCamsUpdated",
  AvailableMicsUpdated = "availableMicsUpdated",
  CamUpdated = "camUpdated",
  MicUpdated = "micUpdated",

  BotConnected = "botConnected",
  BotReady = "botReady",
  BotDisconnected = "botDisconnected",
  BotStartedSpeaking = "botStartedSpeaking",
  BotStoppedSpeaking = "botStoppedSpeaking",
  RemoteAudioLevel = "remoteAudioLevel",

  UserStartedSpeaking = "userStartedSpeaking",
  UserStoppedSpeaking = "userStoppedSpeaking",
  LocalAudioLevel = "localAudioLevel",

  Metrics = "metrics",
  UserTranscript = "userTranscript",
  BotTranscript = "botTranscript",

  LLMFunctionCall = "llmFunctionCall",
  LLMFunctionCallStart = "llmFunctionCallStart",
  LLMJsonCompletion = "llmJsonCompletion",
}

export type RTVIEvents = Partial<{
  connected: () => void;
  disconnected: () => void;
  transportStateChanged: (state: TransportState) => void;

  config: (config: RTVIClientConfigOption[]) => void;
  configUpdated: (config: RTVIClientConfigOption[]) => void;
  configDescribe: (configDescription: unknown) => void;
  actionsAvailable: (actions: unknown) => void;

  participantConnected: (p: Participant) => void;
  participantLeft: (p: Participant) => void;
  trackStarted: (track: MediaStreamTrack, p?: Participant) => void;
  trackStopped: (track: MediaStreamTrack, p?: Participant) => void;

  availableCamsUpdated: (cams: MediaDeviceInfo[]) => void;
  availableMicsUpdated: (cams: MediaDeviceInfo[]) => void;
  camUpdated: (cam: MediaDeviceInfo) => void;
  micUpdated: (cam: MediaDeviceInfo) => void;

  botReady: (botData: BotReadyData) => void;
  botConnected: (p: Participant) => void;
  botDisconnected: (p: Participant) => void;
  botStartedSpeaking: (p: Participant) => void;
  botStoppedSpeaking: (p: Participant) => void;
  remoteAudioLevel: (level: number, p: Participant) => void;

  userStartedSpeaking: () => void;
  userStoppedSpeaking: () => void;
  localAudioLevel: (level: number) => void;

  metrics: (data: PipecatMetricsData) => void;
  userTranscript: (data: TranscriptData) => void;
  botTranscript: (text: TranscriptData) => void;

  error: (message: RTVIMessage) => void;
  messageError: (message: RTVIMessage) => void;

  llmFunctionCall: (func: LLMFunctionCallData) => void;
  llmFunctionCallStart: (functionName: string) => void;
  llmJsonCompletion: (data: string) => void;
}>;

export type RTVIEventHandler<E extends RTVIEvent> = E extends keyof RTVIEvents
  ? RTVIEvents[E]
  : never;

/**
 * @deprecated Use RTVIEventHandler instead.
 */
export type VoiceEventHandler = RTVIEventHandler<RTVIEvent>;
/**
 * @deprecated Use RTVIEvents instead.
 */
export type VoiceEvents = RTVIEvents;
