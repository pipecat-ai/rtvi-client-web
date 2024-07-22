# Real-Time Voice Inference Web SDK

tbd.

## Install

```bash
# Install dependencies & link packages
yarn
# Build voice-sdk
yarn workspace realtime-ai build
# Build voice-sdk-react
yarn workspace realtime-ai-react build
```

## Hack on the framework and play with the sandbox

Watch for file changes:

```bash
yarn workspace realtime-ai run dev
```

Navigate to the sandbox directory and run the project

```bash
yarn workspace rtvi-sandbox run dev
```

Navigate to the URL in your browser


## Bump and publish rtvi-client-js

```bash
# Bump version
yarn workspace realtime-ai version --patch/--minor/--major --message "Bump voice-sdk version"
# Build
yarn workspace realtime-ai build
# Verify package content
npm pack --dry-run --workspace=realtime-ai
# Publish package
npm publish --workspace=realtime-ai
```

## Bump and publish rtiv-client-react

```bash
# Bump version
yarn workspace realtime-ai-react version --patch/--minor/--major --message "Bump voice-sdk version"
# Build
yarn workspace realtime-ai-react build
# Verify package content
npm pack --dry-run --workspace=realtime-ai-react
# Publish package
npm publish --workspace=realtime-ai-react
```
