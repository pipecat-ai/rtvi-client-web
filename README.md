# Groq Voice SDK (Sketch)

## Install

```bash
# Install dependencies & link packages
yarn
# Build voice-sdk
yarn workspace @realtime-ai/voice-sdk build
# Build voice-sdk-react
yarn workspace @realtime-ai/voice-sdk-react build
```

## Bump and publish voice-sdk

```bash
# Bump version
yarn workspace @realtime-ai/voice-sdk version --patch/--minor/--major --message "Bump voice-sdk version"
# Build
yarn workspace @realtime-ai/voice-sdk build
# Verify package content
npm pack --dry-run --workspace=@realtime-ai/voice-sdk
# Publish package
npm publish --workspace=@realtime-ai/voice-sdk
```

## Bump and publish voice-sdk-react

```bash
# Bump version
yarn workspace @realtime-ai/voice-sdk-react version --patch/--minor/--major --message "Bump voice-sdk version"
# Build
yarn workspace @realtime-ai/voice-sdk-react build
# Verify package content
npm pack --dry-run --workspace=@realtime-ai/voice-sdk-react
# Publish package
npm publish --workspace=@realtime-ai/voice-sdk-react
```
