# Real-Time Voice Inference React SDK

## Install

```bash
yarn add realtime-ai realtime-ai-react
# or
npm install realtime-ai realtime-ai-react
```

## Quick Start

Instantiate a `VoiceClient` instance and pass it down to the `VoiceClientProvider`. Render the `<VoiceClientAudio>` component to have audio output setup automatically.

```tsx
import { VoiceClient } from "realtime-ai";
import { VoiceClientAudio, VoiceClientProvider } from "realtime-ai-react";

const voiceClient = new VoiceClient({
  baseUrl: "https://rtvi.pipecat.bot",
  enableMic: true,
});

render(
  <VoiceClientProvider voiceClient={voiceClient}>
    <MyApp />
    <VoiceClientAudio />
  </VoiceClientProvider>
);
```

We recommend starting the voiceClient from a click of a button, so here's a minimal implementation of `<MyApp>` to get started:

```tsx
import { useVoiceClient } from "realtime-ai-react";

const MyApp = () => {
  const voiceClient = useVoiceClient();
  return <button onClick={() => voiceClient.start()}>OK Computer</button>;
};
```

## Components

### `VoiceClientProvider`

Wrap your app with `<VoiceClientProvider>` and pass it a `voiceClient` instance.

### `VoiceClientAudio`

This component wires up the bot's audio track to the DOM.

## Hooks

### `useVoiceClient()`

Returns the `voiceClient` instance, that was originally passed to `VoiceClientProvider`.

### `useVoiceClientEvent(event: VoiceEvent, callback: Function)`

Allows to register event handlers for all supported event callbacks in the VoiceClient.

### `useVoiceClientMediaDevices()`

Returns a list of `availableMics` and `availableCams`, the `selectedMic` and `selectedCam`, and methods `updateMic` and `updateCam` to switch to different media devices.

### `useVoiceClientMediaTrack(trackType, participantType)`

Returns the `MediaStreamTrack` with the given `trackType` (`'audio' | 'video'`) for the given `participantType` (`'local' | 'bot'`). In case no track is available, it returns `null`.

### `useVoiceClientTransportState()`

Returns `voiceClient.state` as React state.

## Contributing

We are welcoming contributions to this project in form of issues and pull request. For questions about RTVI head over to the [Pipecat discord server](https://discord.gg/pipecat) and check the [#rtvi](https://discord.com/channels/1239284677165056021/1265086477964935218) channel.
