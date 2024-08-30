# Real-Time Voice Inference Web SDK

[![Docs](https://img.shields.io/badge/documentation-blue)](https://docs.rtvi.ai)
![NPM Version](https://img.shields.io/npm/v/realtime-ai)

RTVI Web provides a browser client for real-time voice and video inference.

The entry point for creating a client can be found via:

- [RTVI JS](/rtvi-client-js/) `realtime-ai`

React context, hooks and components:

- [RTVI React](/rtvi-client-react/) `realtime-ai-react`

**Transport packages:**

RTVI requires a media transport for sending and receiving audio and video data over the internet. RTVI Web does not include any transport capabilities out of the box, so you will need to install the package for your chosen provider.

Transport packages extend the core `VoiceClient` class, binding provider-specific functionality to the abstract interface.

Currently available transport packages:

- [Daily.co](https://www.daily.co): [RTVI Daily](/rtvi-client-js-daily/) `realtime-ai-daily` (WebRTC)

## Install

```bash
# Install latest package from NPM
npm install realtime-ai realtime-ai-daily
# or 
yarn add realtime-ai realtime-ai-daily
```

## Quickstart

#### Starter projects:

- Demo web client (Next.JS): https://github.com/rtvi-ai/rtvi-web-demo

- Demo infrastructure: https://github.com/rtvi-ai/rtvi-infra-examples

Creating and starting a session with RTVI Web (using Daily as transport):

```typescript
import {DailyVoiceClient} from "realtime-ai-daily";

const voiceClient = new DailyVoiceClient({
    baseUrl: "https://..." // POST endpoint to request a new bot
    enableMic: true,
    enableCam: false,
    services: {
        llm: "openai",
        tts: "cartesia"
    },
    config: [
        {
            service: "tts",
            options: [{ name: "voice", value: "79a125e8-cd45-4c13-8a67-188112f4dd22" }],
        },
        {
            service: "llm",
            options: [
                { name: "model", value: "GPT-4o" }
                {
                    name: "initial_messages",
                    value: [{
                        role: "system",
                        content: "You are a assistant called ExampleBot. You can ask me anything. Keep responses brief and legible. Introduce yourself first."
                    }]
                }
            ]
        }
    ]
});

await voiceClient.start();

```

## Documentation

Docs and API reference can be found at https://docs.rtvi.ai

## Hack on the framework

Install a provider transport

```bash
yarn
yarn workspace realtime-ai build
```

Watch for file changes:

```bash
yarn workspace realtime-ai run dev
```



