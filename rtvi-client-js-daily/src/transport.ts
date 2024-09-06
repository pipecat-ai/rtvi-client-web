import Daily, {
  DailyCall,
  DailyEventObjectAppMessage,
  DailyEventObjectAvailableDevicesUpdated,
  DailyEventObjectLocalAudioLevel,
  DailyEventObjectNonFatalError,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
  DailyEventObjectRemoteParticipantsAudioLevel,
  DailyEventObjectSelectedDevicesUpdated,
  DailyEventObjectTrack,
  DailyParticipant,
} from "@daily-co/daily-js";
import {
  Participant,
  PipecatMetrics,
  Tracks,
  Transport,
  TransportStartError,
  TransportState,
  VoiceClientOptions,
  VoiceMessage,
  VoiceMessageMetrics,
} from "realtime-ai";

export interface DailyTransportAuthBundle {
  room_url: string;
  token: string;
}

export class DailyTransport extends Transport {
  private _daily: DailyCall;
  private _botId: string = "";

  private _selectedCam: MediaDeviceInfo | Record<string, never> = {};
  private _selectedMic: MediaDeviceInfo | Record<string, never> = {};

  constructor(
    options: VoiceClientOptions,
    onMessage: (ev: VoiceMessage) => void
  ) {
    super(options, onMessage);

    const existingInstance = Daily.getCallInstance();
    if (existingInstance) {
      void existingInstance.destroy();
    }
    this._daily = Daily.createCallObject({
      videoSource: options.enableCam ?? false,
      audioSource: options.enableMic ?? false,
      allowMultipleCallInstances: true,
      dailyConfig: {},
    });

    this.attachEventListeners();
  }

  get state(): TransportState {
    return this._state;
  }

  private set state(state: TransportState) {
    if (this._state === state) return;

    this._state = state;
    this._callbacks.onTransportStateChanged?.(state);
  }

  async getAllCams() {
    const { devices } = await this._daily.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  }

  updateCam(camId: string) {
    this._daily
      .setInputDevicesAsync({
        videoDeviceId: camId,
      })
      .then((infos) => {
        this._selectedCam = infos.camera;
      });
  }

  get selectedCam() {
    return this._selectedCam;
  }

  async getAllMics() {
    const { devices } = await this._daily.enumerateDevices();
    return devices.filter((d) => d.kind === "audioinput");
  }

  updateMic(micId: string) {
    this._daily
      .setInputDevicesAsync({
        audioDeviceId: micId,
      })
      .then((infos) => {
        this._selectedMic = infos.mic;
      });
  }

  get selectedMic() {
    return this._selectedMic;
  }

  enableMic(enable: boolean) {
    this._daily.setLocalAudio(enable);
  }

  get isMicEnabled() {
    return this._daily.localAudio();
  }

  enableCam(enable: boolean) {
    this._daily.setLocalVideo(enable);
  }

  get isCamEnabled() {
    return this._daily.localVideo();
  }

  tracks() {
    const participants = this._daily?.participants() ?? {};
    const bot = participants?.[this._botId];

    const tracks: Tracks = {
      local: {
        audio: participants?.local?.tracks?.audio?.persistentTrack,
        screenAudio: participants?.local?.tracks?.screenAudio?.persistentTrack,
        screenVideo: participants?.local?.tracks?.screenVideo?.persistentTrack,
        video: participants?.local?.tracks?.video?.persistentTrack,
      },
    };

    if (bot) {
      tracks.bot = {
        audio: bot?.tracks?.audio?.persistentTrack,
        video: bot?.tracks?.video?.persistentTrack,
      };
    }

    return tracks;
  }

  async initDevices() {
    if (this.state !== "idle") return;

    this.state = "initializing";
    const infos = await this._daily.startCamera();
    const { devices } = await this._daily.enumerateDevices();
    const cams = devices.filter((d) => d.kind === "videoinput");
    const mics = devices.filter((d) => d.kind === "audioinput");
    this._callbacks.onAvailableCamsUpdated?.(cams);
    this._callbacks.onAvailableMicsUpdated?.(mics);
    this._selectedCam = infos.camera;
    this._callbacks.onCamUpdated?.(infos.camera as MediaDeviceInfo);
    this._selectedMic = infos.mic;
    this._callbacks.onMicUpdated?.(infos.mic as MediaDeviceInfo);

    // Instantiate audio observers
    if (!this._daily.isLocalAudioLevelObserverRunning())
      await this._daily.startLocalAudioLevelObserver(100);
    if (!this._daily.isRemoteParticipantsAudioLevelObserverRunning())
      await this._daily.startRemoteParticipantsAudioLevelObserver(100);

    this.state = "initialized";
  }

  async connect(
    authBundle: DailyTransportAuthBundle,
    abortController: AbortController
  ) {
    if (this.state === "idle") {
      await this.initDevices();
    }

    if (abortController.signal.aborted) return;

    this.state = "connecting";

    try {
      await this._daily.join({
        url: authBundle.room_url,
        token: authBundle.token,
      });

      const room = await this._daily.room();
      if (room && "id" in room) {
        this._expiry = room.config?.exp;
      }
    } catch (e) {
      this.state = "error";
      throw new TransportStartError();
    }

    if (abortController.signal.aborted) return;

    this.state = "connected";

    this._callbacks.onConnected?.();
  }

  async sendReadyMessage(): Promise<void> {
    return new Promise<void>((resolve) => {
      (async () => {
        this._daily.on("track-started", (ev) => {
          if (!ev.participant?.local) {
            this.sendMessage(VoiceMessage.clientReady());
            resolve();
          }
        });
      })();
    });
  }

  private attachEventListeners() {
    this._daily.on(
      "available-devices-updated",
      this.handleAvailableDevicesUpdated.bind(this)
    );
    this._daily.on(
      "selected-devices-updated",
      this.handleSelectedDevicesUpdated.bind(this)
    );

    this._daily.on("track-started", this.handleTrackStarted.bind(this));
    this._daily.on("track-stopped", this.handleTrackStopped.bind(this));
    this._daily.on(
      "participant-joined",
      this.handleParticipantJoined.bind(this)
    );
    this._daily.on("participant-left", this.handleParticipantLeft.bind(this));
    this._daily.on("local-audio-level", this.handleLocalAudioLevel.bind(this));
    this._daily.on(
      "remote-participants-audio-level",
      this.handleRemoteAudioLevel.bind(this)
    );
    this._daily.on("app-message", this.handleAppMessage.bind(this));
    this._daily.on("left-meeting", this.handleLeftMeeting.bind(this));
    this._daily.on("nonfatal-error", this.handleNonFatalError.bind(this));
  }

  async disconnect() {
    this._daily.stopLocalAudioLevelObserver();
    this._daily.stopRemoteParticipantsAudioLevelObserver();

    await this._daily.leave();
    await this._daily.destroy();
  }

  public sendMessage(message: VoiceMessage) {
    this._daily.sendAppMessage(message, "*");
  }

  public startScreenShare(): void {
    this._daily.startScreenShare();
  }

  public stopScreenShare(): void {
    this._daily.stopScreenShare();
  }

  public isSharingScreen(): boolean {
    return this._daily.localScreenAudio() || this._daily.localScreenVideo();
  }

  private handleAppMessage(ev: DailyEventObjectAppMessage) {
    // Bubble any messages with realtime-ai label
    if (ev.data.label === "rtvi-ai") {
      this._onMessage({
        id: ev.data.id,
        type: ev.data.type,
        data: ev.data.data,
      } as VoiceMessage);
    } else if (ev.data.type === "pipecat-metrics") {
      // Bubble up pipecat metrics, which don't have the "rtvi-ai" label
      const vmm = new VoiceMessageMetrics(ev.data.metrics as PipecatMetrics);
      this._onMessage(vmm);
    }
  }

  private handleAvailableDevicesUpdated(
    ev: DailyEventObjectAvailableDevicesUpdated
  ) {
    this._callbacks.onAvailableCamsUpdated?.(
      ev.availableDevices.filter((d) => d.kind === "videoinput")
    );
    this._callbacks.onAvailableMicsUpdated?.(
      ev.availableDevices.filter((d) => d.kind === "audioinput")
    );
  }

  private handleSelectedDevicesUpdated(
    ev: DailyEventObjectSelectedDevicesUpdated
  ) {
    if (this._selectedCam?.deviceId !== ev.devices.camera) {
      this._selectedCam = ev.devices.camera;
      this._callbacks.onCamUpdated?.(ev.devices.camera as MediaDeviceInfo);
    }
    if (this._selectedMic?.deviceId !== ev.devices.mic) {
      this._selectedMic = ev.devices.mic;
      this._callbacks.onMicUpdated?.(ev.devices.mic as MediaDeviceInfo);
    }
  }

  private handleTrackStarted(ev: DailyEventObjectTrack) {
    if (ev.type === "screenAudio" || ev.type === "screenVideo") {
      this._callbacks.onScreenTrackStarted?.(
        ev.track,
        ev.participant
          ? dailyParticipantToParticipant(ev.participant)
          : undefined
      );
    } else {
      this._callbacks.onTrackStarted?.(
        ev.track,
        ev.participant
          ? dailyParticipantToParticipant(ev.participant)
          : undefined
      );
    }
  }

  private handleTrackStopped(ev: DailyEventObjectTrack) {
    if (ev.type === "screenAudio" || ev.type === "screenVideo") {
      this._callbacks.onScreenTrackStopped?.(
        ev.track,
        ev.participant
          ? dailyParticipantToParticipant(ev.participant)
          : undefined
      );
    } else {
      this._callbacks.onTrackStopped?.(
        ev.track,
        ev.participant
          ? dailyParticipantToParticipant(ev.participant)
          : undefined
      );
    }
  }

  private handleParticipantJoined(ev: DailyEventObjectParticipant) {
    const p = dailyParticipantToParticipant(ev.participant);

    this._callbacks.onParticipantJoined?.(p);

    if (p.local) return;

    this._botId = ev.participant.session_id;

    this._callbacks.onBotConnected?.(p);
  }

  private handleParticipantLeft(ev: DailyEventObjectParticipantLeft) {
    const p = dailyParticipantToParticipant(ev.participant);

    this._callbacks.onParticipantLeft?.(p);

    if (p.local) return;

    this._botId = "";

    this._callbacks.onBotDisconnected?.(p);
  }

  private handleLocalAudioLevel(ev: DailyEventObjectLocalAudioLevel) {
    this._callbacks.onLocalAudioLevel?.(ev.audioLevel);
  }

  private handleRemoteAudioLevel(
    ev: DailyEventObjectRemoteParticipantsAudioLevel
  ) {
    const participants = this._daily.participants();
    const ids = Object.keys(ev.participantsAudioLevel);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const level = ev.participantsAudioLevel[id];
      this._callbacks.onRemoteAudioLevel?.(
        level,
        dailyParticipantToParticipant(participants[id])
      );
    }
  }

  private handleLeftMeeting() {
    this.state = "disconnected";
    this._botId = "";
    this._callbacks.onDisconnected?.();
  }

  private handleNonFatalError(ev: DailyEventObjectNonFatalError) {
    switch (ev.type) {
      case "screen-share-error":
        this._callbacks.onScreenShareError?.(ev.errorMsg);
        break;
    }
  }
}

const dailyParticipantToParticipant = (p: DailyParticipant): Participant => ({
  id: p.user_id,
  local: p.local,
  name: p.user_name,
});
