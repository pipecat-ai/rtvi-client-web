# Real-Time Voice Inference Web / JS SDK

## Install

```bash
yarn add realtime-ai
# or
npm install realtime-ai
```

## Quick Start

Instantiate a `VoiceClient` instance, wire up the bot's audio, and start the conversation:

```ts
import { VoiceClient } from "realtime-ai";

const handleTrackStarted = (track, participant) => {
  if (participant.local || track.kind !== "audio") return;
  const audioEl = document.createElement("audio");
  audioEl.srcObject = new MediaStream([track]);
  document.body.appendChild(audioEl);
  audioEl.play();
};

const voiceClient = new VoiceClient({
  baseUrl: "https://rtvi.pipecat.bot",
  enableMic: true,
  callbacks: {
    onTrackStarted: handleTrackStarted,
  },
});

voiceClient.start();
```

## API

### VoiceClient configuration options

#### `baseUrl`

The `baseUrl` points to the RTVI server component for authenticating the user and initializing the required infrastructure for starting the bot conversation. `'https://rtvi.pipecat.bot'` provides demo endpoints for trying out RTVI.

#### `transport` (optional)

Configures the transport layer for media streaming, event and message handling. This defaults to the [Daily](https://daily.co) transport layer.

#### `transportURL` (optional)

Allows to configure a custom domain to be used in the transport layer.

#### `enableMic` (optional)

Enables the user's microphone when starting the conversation. Defaults to `true`.

#### `enableCam` (optional)

Enables the user's camera when starting the conversation. Defaults to `false`.

#### `callbacks` (optional)

Allows to configure callbacks for voice events. It's also possible to dynamically register event handlers using `.on`.

#### `config` (optional)

Allows for further customization of used services, like TTS and LLM.

### VoiceClient instance methods

#### `initDevices()`

This method initializes the media device selection and allows user's to test and switch media devices before starting the conversation.

#### `start()`

Sets up and starts the conversation.

#### `disconnect()`

Stops the conversation and tears down all network connections.

#### `getAllMics()`

Returns a list of available microphones in the form of [`MediaDeviceInfo[]`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo).

#### `getAllCams()`

Returns a list of available cameras in the form of [`MediaDeviceInfo[]`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDeviceInfo).

#### `updateMic(micId: string)`

Switches to the microphone identified by the provided `micId`, which should map a `deviceId` in the list returned from [`getAllMics()`](#getAllMics).

#### `updateCam(camId: string)`

Switches to the camera identified by the provided `camId`, which should map a `deviceId` in the list returned from [`getAllCams()`](#getAllCams).

#### `enableMic(enable: boolean)`

Enables or disables the user's microphone, based on provided `enable`.

#### `enableCam(enable: boolean)`

Enables or disables the user's camera, based on provided `enable`.

#### `tracks()`

Returns all available `MediaStreamTrack`s for the user and bot.

```ts
// Return type
{
  local: {
    audio?: MediaStreamTrack;
    video?: MediaStreamTrack;
  },
  bot?: {
    audio?: MediaStreamTrack;
    video?: MediaStreamTrack;
  }
}
```

#### `updateConfig(config: VoiceClientConfigOptions, { useDeepMerge, sendPartial })`

Allows to dynamically update the server-side config for the bot's pipeline.

#### `appendLLMContext(messages: VoiceClientLLMMessage | VoiceClientLLMMessage[])`

Appends a message to the live LLM context. Requires the bot to be connected.

#### `say(text: string, interrupt: boolean)`

Sends a string to the STT model to be spoken. Requires the bot to be connected. Set `interrupt` to true to interrupt the bot, if it's currently talking.

#### `interrupt()`

Interrupts the bot if it's currently talking. Requires the bot to be connected.

### VoiceClient properties

#### `state`

Returns the current transport state. Can be one of:

- `"idle"` – The `VoiceClient` is instantiated
- `"initializing"` – `VoiceClient` is initializing devices
- `"initialized"` – `VoiceClient` devices are initialized
- `"connecting"` – `VoiceClient` is setting up the connection to the server
- `"connected"` – `VoiceClient` is connected to the server
- `"ready"` – The bot is connected and ready to be interacted with
- `"disconnected"` – The connection to the server was torn down
- `"error"` – An error occurred

#### `selectedMic`

Returns the currently selected microphone as `MediaDeviceInfo`.

#### `selectedCam`

Returns the currently selected camera as `MediaDeviceInfo`.

#### `isMicEnabled`

Returns `true` when the microphone is enabled.

#### `isCamEnabled`

Returns `true` when the camera is enabled.

#### `config`

Returns the current `config`, as set in the constructor, or after calling [`updateConfig()`](#updateConfig)

#### `llmContext`

Returns the current LLM context, as set in `config.llm`.

#### `transportExpiry`

Returns the session expiry time for the transport session, if applicable.

## Contributing

We are welcoming contributions to this project in form of issues and pull request. For questions about RTVI head over to the [Pipecat discord server](https://discord.gg/pipecat) and check the [#rtvi](https://discord.com/channels/1239284677165056021/1265086477964935218) channel.
