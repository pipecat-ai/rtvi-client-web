import { Participant, TransportState } from "./transport";

export enum VoiceEvent {
  Connected = "connected",
  Disconnected = "disconnected",
  TransportStateChanged = "stateChanged",

  ParticipantConnected = "participantConnected",
  ParticipantLeft = "participantLeft",
  TrackStarted = "trackStarted",
  TrackedStopped = "trackStopped",

  BotStartedTalking = "botStartedTalking",
  BotStoppedTalking = "botStoppedTalking",
  RemoteAudioLevel = "remoteAudioLevel",

  LocalStartedTalking = "localStartedTalking",
  LocalStoppedTalking = "localStoppedTalking",
  LocalAudioLevel = "localAudioLevel",
}

export type VoiceEvents = {
  connected: () => void;
  disconnected: () => void;
  stateChanged: (state: TransportState) => void;

  participantConnected: (p: Participant) => void;
  participantLeft: (p: Participant) => void;
  trackStarted: (track: MediaStreamTrack, p?: Participant) => void;
  trackStopped: (track: MediaStreamTrack, p?: Participant) => void;

  botStartedTalking: (p: Participant) => void;
  botStoppedTalking: (p: Participant) => void;
  remoteAudioLevel: (level: number, p: Participant) => void;

  localStartedTalking: () => void;
  localStoppedTalking: () => void;
  localAudioLevel: (level: number) => void;
};

export type VoiceEventHandler<E extends VoiceEvent> =
  E extends keyof VoiceEvents ? VoiceEvents[E] : never;
