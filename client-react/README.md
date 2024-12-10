<h1><div align="center">
 <img alt="pipecat react" width="500px" height="auto" src="https://raw.githubusercontent.com/pipecat-ai/pipecat-client-web/main/pipecat-react.png">
</div></h1>

[![Docs](https://img.shields.io/badge/documentation-blue)](https://docs.pipecat.ai/client/introduction)
![NPM Version](https://img.shields.io/npm/v/@pipecat-ai/client-react)

## Install

```bash
npm install @pipecat-ai/client-js @pipecat-ai/client-react
```

## Quick Start

Instantiate an `RTVIClient` instance and pass it down to the `RTVIClientProvider`. Render the `<RTVIClientAudio>` component to have audio output setup automatically.

```tsx
import { RTVIClient } from "@pipecat-ai/client-js";
import { RTVIClientAudio, RTVIClientProvider } from "@pipecat-ai/client-react";

const client = new RTVIClient({
  baseUrl: "https://rtvi.pipecat.bot",
  enableMic: true,
});

render(
  <RTVIClientProvider client={client}>
    <MyApp />
    <RTVIClientAudio />
  </RTVIClientProvider>
);
```

We recommend starting the voiceClient from a click of a button, so here's a minimal implementation of `<MyApp>` to get started:

```tsx
import { useRTVIClient } from "@pipecat-ai/client-react";

const MyApp = () => {
  const client = useRTVIClient();
  return <button onClick={() => client.start()}>OK Computer</button>;
};
```

## Components

### RTVIClientProvider

The root component for providing RTVI client context to your application.

#### Props

- `client` (RTVIClient, required): A singleton instance of RTVIClient.

```jsx
<RTVIClientProvider client={rtviClient}>
  {/* Child components */}
</RTVIClientProvider>
```

### RTVIClientAudio

Creates a new `<audio>` element that mounts the bot's audio track.

#### Props

No props

```jsx
<RTVIClientAudio />
```

### RTVIClientVideo

Creates a new `<video>` element that renders either the bot or local participant's video track.

#### Props

- `participant` ("local" | "bot"): Defines which participant's video track is rendered
- `fit` ("contain" | "cover", optional): Defines whether the video should be fully contained or cover the box. Default: 'contain'.
- `mirror` (boolean, optional): Forces the video to be mirrored, if set.
- `onResize(dimensions: object)` (function, optional): Triggered whenever the video's rendered width or height changes. Returns the video's native `width`, `height` and `aspectRatio`.

```jsx
<RTVIClientVideo
  participant="local"
  fit="cover"
  mirror
  onResize={({ aspectRatio, height, width }) => {
    console.log("Video dimensions changed:", { aspectRatio, height, width });
  }}
/>
```

### VoiceVisualizer

Renders a visual representation of audio input levels on a `<canvas>` element.
The visualization consists of five vertical bars.

#### Props

- `participantType` (string, required): The participant type to visualize audio for.
- `backgroundColor` (string, optional): The background color of the canvas. Default: 'transparent'.
- `barColor` (string, optional): The color of the audio level bars. Default: 'black'.
- `barGap` (number, optional): The gap between bars in pixels. Default: 12.
- `barWidth` (number, optional): The width of each bar in pixels. Default: 30.
- `barMaxHeight` (number, optional): The maximum height at full volume of each bar in pixels. Default: 120.

```jsx
<VoiceVisualizer
  participantType="local"
  backgroundColor="white"
  barColor="black"
  barGap={1}
  barWidth={4}
  barMaxHeight={24}
/>
```

## Hooks

### useRTVIClient

Provides access to the `RTVIClient` instance originally passed to [`RTVIClientProvider`](#rtviclientprovider).

```jsx
import { useRTVIClient } from "@pipecat-ai/client-react";

function MyComponent() {
  const rtviClient = useRTVIClient();
}
```

### useRTVIClientEvent

Allows subscribing to RTVI client events.
It is advised to wrap handlers with `useCallback`.

#### Arguments

- `event` (RTVIEvent, required)
- `handler` (function, required)

```jsx
import { useCallback } from "react";
import { RTVIEvent, TransportState } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";

function EventListener() {
  useRTVIClientEvent(
    RTVIEvent.TransportStateChanged,
    useCallback((transportState: TransportState) => {
      console.log("Transport state changed to", transportState);
    }, [])
  );
}
```

### useRTVIClientMediaDevices

Manage and list available media devices.

```jsx
import { useRTVIClientMediaDevices } from "@pipecat-ai/client-react";

function DeviceSelector() {
  const {
    availableCams,
    availableMics,
    selectedCam,
    selectedMic,
    updateCam,
    updateMic,
  } = useRTVIClientMediaDevices();

  return (
    <>
      <select
        name="cam"
        onChange={(ev) => updateCam(ev.target.value)}
        value={selectedCam?.deviceId}
      >
        {availableCams.map((cam) => (
          <option key={cam.deviceId} value={cam.deviceId}>
            {cam.label}
          </option>
        ))}
      </select>
      <select
        name="mic"
        onChange={(ev) => updateMic(ev.target.value)}
        value={selectedMic?.deviceId}
      >
        {availableMics.map((mic) => (
          <option key={mic.deviceId} value={mic.deviceId}>
            {mic.label}
          </option>
        ))}
      </select>
    </>
  );
}
```

### useRTVIClientMediaTrack

Access audio and video tracks.

#### Arguments

- `trackType` ("audio" | "video", required)
- `participantType` ("bot" | "local", required)

```jsx
import { useRTVIClientMediaTrack } from "@pipecat-ai/client-react";

function MyTracks() {
  const localAudioTrack = useRTVIClientMediaTrack("audio", "local");
  const botAudioTrack = useRTVIClientMediaTrack("audio", "bot");
}
```

### useRTVIClientTransportState

Returns the current transport state.

```jsx
import { useRTVIClientTransportState } from "@pipecat-ai/client-react";

function ConnectionStatus() {
  const transportState = useRTVIClientTransportState();
}
```
