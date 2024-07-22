# Voice SDK (Sketch)

## Install

```bash
# Install dependencies & link packages
yarn
# Build voice-sdk
yarn workspace realtime-ai build
# Build voice-sdk-react
yarn workspace realtime-ai-react build
```

## Local development

```
yarn workspace realtime-ai dev
yarn workspace realtime-ai-react dev
yarn workspace voice-demo dev
```

## Bump and publish voice-sdk

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

## Bump and publish voice-sdk-react

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
