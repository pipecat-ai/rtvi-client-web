import {
  BotReadyData,
  LLMFunctionCallData,
  PipecatMetrics,
  Transcript,
  VoiceClientConfigOption,
  VoiceMessage,
} from ".";
import { Participant, TransportState } from "./transport";

// Change these to snake case to match the rest of the codebase
// Make a strict string enum

export enum VoiceEvent {
  MessageError = "messageError",
  Error = "error",

  Connected = "connected",
  Disconnected = "disconnected",
  TransportStateChanged = "transportStateChanged",

  ConfigUpdated = "configUpdated",
  ConfigDescribe = "configDescribe",

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
  JSONCompletion = "jsonCompletion",
}

export type VoiceEvents = {
  connected: () => void;
  disconnected: () => void;
  transportStateChanged: (state: TransportState) => void;

  configUpdated: (config: VoiceClientConfigOption[]) => void;
  configDescribe: (configDescription: unknown) => void;

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

  metrics: (data: PipecatMetrics) => void;
  userTranscript: (data: Transcript) => void;
  botTranscript: (text: string) => void;
  llmFunctionCall: (func: LLMFunctionCallData) => unknown;
  llmFunctionCallStart: (functionName: string) => void;
  jsonCompletion: (data: string) => void;

  error: (message: VoiceMessage) => void;
  messageError: (message: VoiceMessage) => void;
};

export type VoiceEventHandler<E extends VoiceEvent> =
  E extends keyof VoiceEvents ? VoiceEvents[E] : never;
