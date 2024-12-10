import { RTVIClientConfigOption } from ".";
import { LLMFunctionCallData } from "./helpers/llm";
import {
  BotLLMTextData,
  BotReadyData,
  BotTTSTextData,
  PipecatMetricsData,
  RTVIMessage,
  StorageItemStoredData,
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
  TrackStopped = "trackStopped",

  AvailableCamsUpdated = "availableCamsUpdated",
  AvailableMicsUpdated = "availableMicsUpdated",
  AvailableSpeakersUpdated = "availableSpeakersUpdated",
  CamUpdated = "camUpdated",
  MicUpdated = "micUpdated",
  SpeakerUpdated = "speakerUpdated",

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

  BotLlmText = "botLlmText",
  BotLlmStarted = "botLlmStarted",
  BotLlmStopped = "botLlmStopped",

  BotTtsText = "botTtsText",
  BotTtsStarted = "botTtsStarted",
  BotTtsStopped = "botTtsStopped",

  LLMFunctionCall = "llmFunctionCall",
  LLMFunctionCallStart = "llmFunctionCallStart",
  LLMJsonCompletion = "llmJsonCompletion",

  StorageItemStored = "storageItemStored",

  /**
   * @deprecated Use BotLlmText instead
   */
  BotText = "botText",
}

export type RTVIEvents = Partial<{
  connected: () => void;
  disconnected: () => void;
  transportStateChanged: (state: TransportState) => void;

  config: (config: RTVIClientConfigOption[]) => void;
  configUpdated: (config: RTVIClientConfigOption[]) => void;
  configDescribe: (configDescription: unknown) => void;
  actionsAvailable: (actions: unknown) => void;

  participantConnected: (participant: Participant) => void;
  participantLeft: (participant: Participant) => void;
  trackStarted: (track: MediaStreamTrack, participant?: Participant) => void;
  trackStopped: (track: MediaStreamTrack, participant?: Participant) => void;

  availableCamsUpdated: (cams: MediaDeviceInfo[]) => void;
  availableMicsUpdated: (mics: MediaDeviceInfo[]) => void;
  availableSpeakersUpdated: (speakers: MediaDeviceInfo[]) => void;
  camUpdated: (cam: MediaDeviceInfo) => void;
  micUpdated: (mic: MediaDeviceInfo) => void;
  speakerUpdated: (speaker: MediaDeviceInfo) => void;

  botReady: (botData: BotReadyData) => void;
  botConnected: (participant: Participant) => void;
  botDisconnected: (participant: Participant) => void;
  botStartedSpeaking: () => void;
  botStoppedSpeaking: () => void;
  remoteAudioLevel: (level: number, p: Participant) => void;

  userStartedSpeaking: () => void;
  userStoppedSpeaking: () => void;
  localAudioLevel: (level: number) => void;

  metrics: (data: PipecatMetricsData) => void;

  userTranscript: (data: TranscriptData) => void;
  botTranscript: (data: BotLLMTextData) => void;

  botLlmText: (data: BotLLMTextData) => void;
  botLlmStarted: () => void;
  botLlmStopped: () => void;

  botTtsText: (data: BotTTSTextData) => void;
  botTtsStarted: () => void;
  botTtsStopped: () => void;

  error: (message: RTVIMessage) => void;
  messageError: (message: RTVIMessage) => void;

  llmFunctionCall: (func: LLMFunctionCallData) => void;
  llmFunctionCallStart: (functionName: string) => void;
  llmJsonCompletion: (data: string) => void;

  storageItemStored: (data: StorageItemStoredData) => void;

  /**
   * @deprecated Use BotLlmText instead
   */
  botText: (data: BotLLMTextData) => void;
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
