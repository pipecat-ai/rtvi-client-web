/**
 * Copyright (c) 2024, Daily.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { RTVIClientOptions, RTVIEventCallbacks } from "./client";
import { RTVIMessage } from "./messages";

export type TransportState =
  | "disconnected"
  | "initializing"
  | "initialized"
  | "authenticating"
  | "connecting"
  | "connected"
  | "ready"
  | "disconnecting"
  | "error";

export type Participant = {
  id: string;
  name: string;
  local: boolean;
};

export type Tracks = {
  local: {
    audio?: MediaStreamTrack;
    video?: MediaStreamTrack;
    screenAudio?: MediaStreamTrack;
    screenVideo?: MediaStreamTrack;
  };
  bot?: {
    audio?: MediaStreamTrack;
    screenAudio?: undefined;
    screenVideo?: undefined;
    video?: MediaStreamTrack;
  };
};

export abstract class Transport {
  protected declare _options: RTVIClientOptions;
  protected declare _onMessage: (ev: RTVIMessage) => void;
  protected declare _callbacks: RTVIEventCallbacks;
  protected _state: TransportState = "disconnected";
  protected _expiry?: number = undefined;

  constructor() {}

  abstract initialize(
    options: RTVIClientOptions,
    messageHandler: (ev: RTVIMessage) => void
  ): void;

  abstract initDevices(): Promise<void>;

  abstract connect(
    authBundle: unknown,
    abortController: AbortController
  ): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendReadyMessage(): void;

  abstract getAllMics(): Promise<MediaDeviceInfo[]>;
  abstract getAllCams(): Promise<MediaDeviceInfo[]>;
  abstract getAllSpeakers(): Promise<MediaDeviceInfo[]>;
  abstract startScreenShare(): Promise<void>;
  abstract stopScreenShare(): Promise<void>;
  abstract isSharingScreen(): Promise<boolean>;

  abstract updateMic(micId: string): void;
  abstract updateCam(camId: string): void;
  abstract updateSpeaker(speakerId: string): void;

  abstract get selectedMic(): MediaDeviceInfo | Record<string, never>;
  abstract get selectedCam(): MediaDeviceInfo | Record<string, never>;
  abstract get selectedSpeaker(): MediaDeviceInfo | Record<string, never>;

  abstract enableMic(enable: boolean): void;
  abstract enableCam(enable: boolean): void;

  abstract get isCamEnabled(): boolean;
  abstract get isMicEnabled(): boolean;

  abstract sendMessage(message: RTVIMessage): void;

  abstract get state(): TransportState;
  abstract set state(state: TransportState);

  get expiry(): number | undefined {
    return this._expiry;
  }

  abstract tracks(): Tracks;
}
