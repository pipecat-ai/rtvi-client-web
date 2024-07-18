# Real-Time Voice Inference React SDK

tbd.

## Install

```bash
yarn add voice-sdk voice-sdk-react
# or
npm install voice-sdk voice-sdk-react
```

## Getting started

```tsx
import { VoiceClient } from "@realtime-ai/voice-sdk";
import {
  useVoiceClient,
  VoiceClientProvider,
} from "@realtime-ai/voice-sdk-react";

const voiceClient = new VoiceClient({
  apiKey: "…",
  enableMic: true,
});

render(
  <VoiceClientProvider voiceClient={voiceClient}>
    <MyVoiceApp />
  </VoiceClientProvider>
);

const MyVoiceApp = () => {
  const voiceClient = useVoiceClient();

  return (
    <>
      <button onClick={() => voiceClient?.start()}>Talk to a bot</button>
    </>
  );
};
```

## Advanced configuration

tbd.

## Contributing

tbd.
