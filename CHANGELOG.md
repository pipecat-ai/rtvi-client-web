# Changelog

All notable changes to **RTVI Client Web** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-09-13

RTVI 0.2.0 removes client-side configuration to ensure state management is handled exclusively by the bot. Clients no longer maintain an internal config array that can be altered outside of a ready state. Developers needing stateful configuration before a session starts should implement it independently.

This change enforces a key design principle of the RTVI standard: the bot should always be the single source of truth for configuration, and clients should remain stateless.

This release also preludes the implementation of a `TextClient` by renaming classes and types away from `VoiceClientX` to `RTVIClientX`. Where possible, we have left aliased deprecations to support backwards compatibility. 

### Added

- `startParams` client constructor param, a partial object that will be sent as JSON stringified body params at `start()` to your hosted endpoint. If you want to declare initial configuration in your client, or specify start services on the client, you can declare them here.
- `onConfig` and `VoiceEvents.Config` callback & event added, triggered by `getConfig` voice message.
- `@transportReady` decorator added to methods that should only be called at runtime. Note: decorator support required several Parcel configuration changes and additional dev dependencies.
- `@getIfTransportInState` getter decorator added to getter methods that should only be called in a specified transport state.

### Changed

- Client no longer expects a `services` map as a constructor param (note: remains in place but flagged as deprecated.) If you want to pass a services map to your endpoint, please use `startParams`.
- Config getter and setter methods (`getConfig` and `updateConfig`) are only supported at runtime. 
- `updateConfig` promise is typed to `Promise<VoiceMessage>` (previously `unknown` to support offline updates.)
- `getConfig` promise is typed to `Promise<VoiceClientOptions[]>` (previously `unknown` to support offline updates.)
- `services` getter and setter methods have been deprecated.
- `getServiceOptionsFromConfig`, `getServiceOptionValueFromConfig`, `setConfigOptions` and `setServiceOptionInConfig` are now async to support `getConfig` at runtime and accept an optional `config` param for working with local config arrays.
- `registerHelper` no longer checks for a registered service and instead relies on string matching.
- LLM Helper `getContext()` now accepts optional `config` param for working with local configs.
- `customAuthHandler` updated to receive `startParams` as second dependency.
- jest tests updated to reflect changes.
- `VoiceClientOptions` is now `RTVIClientOptions`.
- `VoiceClientConfigOption` is now `RTVICClientConfigOption`.

### Fixed

- `VoiceMessageType.CONFIG` message now correctly calls `onConfig` and `VoiceEvents.Config`.

### Deprecated 

- `getBotConfig` has been renamed to `getConfig` to match the bot action name / for consistency.
- voiceClient.config getter is deprecated.
- `config` and `services` constructor params should now be set inside of `startParams` and are optional. 
- `customBodyParams` and `customHeaders` have been marked as deprecated. Use `startParams` instead.

### Removed

- `voiceClient.partialToConfig` removed (unused)



## [0.1.10] - 2024-09-06

- LLMContextMessage content not types to `unknown` to support broader LLM use-cases.

## [0.1.9] - 2024-09-04

### Changed

- `voiceClient.action()` now returns a new type `VoiceMessageActionResponse` that aligns to RTVI's action response shape. Dispatching an action is the same as dispatching a `VoiceMessage` except the messageDispatcher will type the response accordingly. `action-response` will resolve or reject as a `VoiceMessageActionResponse`, whereas any other message type is typed as a `VoiceMessage`. This change makes it less verbose to handle action responses, where the `data` blob will always contain a `result` property.
- LLM Helper `getContext` returns a valid promise return type (`Promise<LLMContext>`).
- LLMHelper `getContext` resolves with the action result (not the data object).
- LLMHelper `setContext` returns a valid promise return type (`Promise<boolean>`).
- LLMHelper `setContext` resolves with the action result boolean (not the data object).
- LLMHelper `appendToMessages` returns a valid promise return type (`Promise<boolean>`).
- LLMHelper `appendToMessages` resolves with the action result boolean (not the data object).

### Fixed

- `customAuthHandler` is now provided with the timeout object, allowing developers to manually clear it (if set) in response to their custom auth logic.
- `getServiceOptionsFromConfig` returns `unknown | undefined` when a service option is not found in the config definition.
- `getServiceOptionsValueFromConfig` returns `unknown | undefined` when a service option or value is not found in the config definition.
- `getServiceOptionValueFromConfig` returns a deep clone of the value, to avoid nested references.
- `VoiceMessageType.CONFIG_AVAILABLE` resolves the dispatched action, allowing `describeConfig()` to be awaited.
- `VoiceMessageType.ACTIONS_AVAILABLE` resolves the dispatched action, allowing `describeActions()` to be awaited.

### Added

- Action dispatch tests

## [0.1.8] - 2024-09-02

### Fixed

- `getServiceOptionsFromConfig` and `getServiceOptionValueFromConfig` return a deep clone of property to avoid references in returned values.
- LLM Helper `getContext` now returns a new instance of context when not in ready state.

### Changed

- `updateConfig` now calls the `onConfigUpdated` callback (and event) when not in ready state.


## [0.1.7] - 2024-08-28

### Fixed

- All config mutation methods (getServiceOptionsFromConfig, getServiceOptionValueFromConfig, setServiceOptionInConfig) now work when not in a ready state.

### Added

- New config method: `getServiceOptionValueFromConfig`. Returns value of config service option with passed service key and option name.
- setServiceOptionInConfig now accepts either one or many ConfigOption arguments (and will set or update all)
- setServiceOptionInConfig now accepts an optional 'config' param, which it will use over the default VoiceClient config. Useful if you want to mutate an existing config option across multiple services before calling `updateConfig`.
- New config method `setConfigOptions` updates multiple service options by running each item through `setServiceOptionInConfig`.

### Fixed

- "@daily-co/daily-js" should not be included in the `rtvi-client-js` package.json. This dependency is only necessary for `rtvi-client-js-daily`.
- Jest unit tests added for config manipulation within `rtvi-client-js` (`yarn run test`)

## [0.1.6] - 2024-08-26

### Fixed

- `getServiceOptionsFromConfig` should return a new object, not an instance of the config. This prevents methods like `setContext` from mutating local config unintentionally.

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