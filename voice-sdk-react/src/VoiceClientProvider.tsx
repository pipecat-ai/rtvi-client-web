import { createContext } from "react";

import { VoiceClient } from "voice-sdk";

interface Props {
  voiceClient: VoiceClient;
}

export const VoiceClientContext = createContext<{ voiceClient?: VoiceClient }>(
  {}
);

export const VoiceClientProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  voiceClient,
}) => {
  return (
    <VoiceClientContext.Provider value={{ voiceClient }}>
      {children}
    </VoiceClientContext.Provider>
  );
};
