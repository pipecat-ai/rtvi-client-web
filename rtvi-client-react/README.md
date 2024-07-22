# Real-Time Voice Inference React SDK

tbd.

## Install

```bash
yarn add realtime-ai realtime-ai-react
# or
npm install realtime-ai realtime-ai-react
```

## Getting started

```tsx
import { VoiceClient } from "realtime-ai";
import { useVoiceClient, VoiceClientProvider } from "realtime-ai-react";

const voiceClient = new VoiceClient({
  baseUrl: "…",
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
