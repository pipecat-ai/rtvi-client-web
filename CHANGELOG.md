# Changelog

All notable changes to **RTVI Client Web** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2024-08-19

### Added

- Client now sends a `client-ready` message once it receives a track start event from the transport. This avoids scenarios where the bot starts speaking too soon, before the client has had a change to subscribe to the audio track.

## [0.1.4] - 2024-08-19

### Added

- VoiceClientVideo component added to `rtvi-client-react` for rendering local or remote video tracks
- partialToConfig voice client method that returns a new VoiceClientConfigOption[] from provided partial. Does not update config.

### Fixed

- Fixes an issue when re-creating a DailyVoiceClient. Doing so will no longer result in throwing an error. Note: Simultaneous DailyVoiceClient instances is not supported. Creating a new DailyVoiceClient will invalidate any pre-existing ones.

## [0.1.3] - 2024-08-17

### Added

- `setServiceOptionsInConfig` Returns mutated / merged config for specified key and service config option
- Voice client constructor `customBodyParams:object`. Add custom request parameters to send with the POST request to baseUrl
- Set voice client services object (when client has not yet connected)

### Fixed

- Pass timeout to customAuthHandler

## [0.1.2] - 2024-08-16

- API refactor to align to RTVI 0.1