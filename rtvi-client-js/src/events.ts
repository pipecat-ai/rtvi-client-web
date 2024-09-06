import {
  BotReadyData,
  LLMFunctionCallData,
  PipecatMetrics,
  Transcript,
  VoiceClientConfigOption,
  VoiceMessage,
} from ".";
import { Participant, TransportState } from "./transport";

export enum VoiceEvent {
  MessageError = "messageError",
  Error = "error",
  ScreenShareError = "screenShareError",

  Connected = "connected",
  Disconnected = "disconnected",
  TransportStateChanged = "transportStateChanged",

  ConfigUpdated = "configUpdated",
  ConfigDescribe = "configDescribe",
  ActionsAvailable = "actionsAvailable",

  ParticipantConnected = "participantConnected",
  ParticipantLeft = "participantLeft",
  TrackStarted = "trackStarted",
  TrackedStopped = "trackStopped",
  ScreenTrackStarted = "screenTrackStarted",
  ScreenTrackStopped = "screenTrackStopped",

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

export type VoiceEvents = Partial<{
  connected: () => void;
  disconnected: () => void;
  transportStateChanged: (state: TransportState) => void;

  configUpdated: (config: VoiceClientConfigOption[]) => void;
  configDescribe: (configDescription: unknown) => void;
  actionsAvailable: (actions: unknown) => void;

  participantConnected: (p: Participant) => void;
  participantLeft: (p: Participant) => void;
  trackStarted: (track: MediaStreamTrack, p?: Participant) => void;
  trackStopped: (track: MediaStreamTrack, p?: Participant) => void;
  screenTrackStarted: (track: MediaStreamTrack, p?: Participant) => void;
  screenTrackStopped: (track: MediaStreamTrack, p?: Participant) => void;

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

  error: (message: VoiceMessage) => void;
  messageError: (message: VoiceMessage) => void;
  screenShareError: (errorMessage: string) => void;

  llmFunctionCall: (func: LLMFunctionCallData) => void;
  llmFunctionCallStart: (functionName: string) => void;
  llmJsonCompletion: (data: string) => void;
}>;

export type VoiceEventHandler<E extends VoiceEvent> =
  E extends keyof VoiceEvents ? VoiceEvents[E] : never;
