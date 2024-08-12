import {
  BotReadyData,
  PipecatMetrics,
  Transcript,
  VoiceClientConfigOption,
} from ".";
import { Participant, TransportState } from "./transport";

export enum VoiceEvent {
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
  BotStartedTalking = "botStartedTalking",
  BotStoppedTalking = "botStoppedTalking",
  RemoteAudioLevel = "remoteAudioLevel",

  LocalStartedTalking = "localStartedTalking",
  LocalStoppedTalking = "localStoppedTalking",
  LocalAudioLevel = "localAudioLevel",

  JSONCompletion = "jsonCompletion",
  Metrics = "metrics",
  UserTranscript = "userTranscript",
  BotTranscript = "botTranscript",
  LLMFunctionCall = "llmFunctionCall",
  LLMFunctionCallStart = "llmFunctionCall",
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
  botStartedTalking: (p: Participant) => void;
  botStoppedTalking: (p: Participant) => void;
  remoteAudioLevel: (level: number, p: Participant) => void;

  localStartedTalking: () => void;
  localStoppedTalking: () => void;
  localAudioLevel: (level: number) => void;

  jsonCompletion: (jsonString: string) => void;
  metrics: (data: PipecatMetrics) => void;
  userTranscript: (data: Transcript) => void;
  botTranscript: (text: string) => void;
  llmFunctionCall: (functionName: string, toolCallId: string, args: any) => any;
  llmFunctionCallStart: (functionName: string) => void;
};

export type VoiceEventHandler<E extends VoiceEvent> =
  E extends keyof VoiceEvents ? VoiceEvents[E] : never;
