export enum VoiceEvent {
  Connected = "connected",
  Disconnected = "disconnected",
  TransportStateChanged = "stateChanged",

  // @@ Not yet implemented @@
  ParticipantConnected = "participantConnected",
  ParticipantLeft = "participantLeft",
  TrackStarted = "trackStarted",
  TrackedStopped = "trackStopped",
}

export type VoiceEvents = {
  connected: () => void;
  disconnected: () => void;
  stateChanged: (state: string) => void;
};
