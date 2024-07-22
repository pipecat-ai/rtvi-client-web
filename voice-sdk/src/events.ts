import { VoiceClientConfigOptions } from ".";
import { Participant, TransportState } from "./transport";

export enum VoiceEvent {
  Connected = "connected",
  Disconnected = "disconnected",
  TransportStateChanged = "transportStateChanged",

  ConfigUpdated = "configUpdated",

  ParticipantConnected = "participantConnected",
  ParticipantLeft = "participantLeft",
  TrackStarted = "trackStarted",
  TrackedStopped = "trackStopped",

  AvailableCamsUpdated = "availableCamsUpdated",
  AvailableMicsUpdated = "availableMicsUpdated",
  CamUpdated = "camUpdated",
  MicUpdated = "micUpdated",

  BotStartedTalking = "botStartedTalking",
  BotStoppedTalking = "botStoppedTalking",
  RemoteAudioLevel = "remoteAudioLevel",

  LocalStartedTalking = "localStartedTalking",
  LocalStoppedTalking = "localStoppedTalking",
  LocalAudioLevel = "localAudioLevel",
  JSONCompletion = "jsonCompletion",
}

export type VoiceEvents = {
  connected: () => void;
  disconnected: () => void;
  transportStateChanged: (state: TransportState) => void;

  configUpdated: (config: VoiceClientConfigOptions) => void;

  participantConnected: (p: Participant) => void;
  participantLeft: (p: Participant) => void;
  trackStarted: (track: MediaStreamTrack, p?: Participant) => void;
  trackStopped: (track: MediaStreamTrack, p?: Participant) => void;

  availableCamsUpdated: (cams: MediaDeviceInfo[]) => void;
  availableMicsUpdated: (cams: MediaDeviceInfo[]) => void;
  camUpdated: (cam: MediaDeviceInfo) => void;
  micUpdated: (cam: MediaDeviceInfo) => void;

  botStartedTalking: (p: Participant) => void;
  botStoppedTalking: (p: Participant) => void;
  remoteAudioLevel: (level: number, p: Participant) => void;

  localStartedTalking: () => void;
  localStoppedTalking: () => void;
  localAudioLevel: (level: number) => void;

  jsonCompletion: (jsonString: string) => void;
};

export type VoiceEventHandler<E extends VoiceEvent> =
  E extends keyof VoiceEvents ? VoiceEvents[E] : never;
