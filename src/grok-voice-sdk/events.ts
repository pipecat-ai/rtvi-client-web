export enum VoiceEvent {
  Started = "started",
  Disconnected = "disconnected",
  TransportStateChanged = "stateChanged",

  // @@ Not yet implemented @@
  ParticipantConnected = "participantConnected",
  ParticipantLeft = "participantLeft",
  TrackStarted = "trackStarted",
  TrackedStopped = "trackStopped",
}

export type VoiceEvents = {
  started: () => void;
  disconnected: () => void;
  stateChanged: (state: string) => void;
};
