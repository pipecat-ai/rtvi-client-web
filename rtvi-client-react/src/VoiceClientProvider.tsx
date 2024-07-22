import { createContext } from "react";

import { VoiceClient } from "realtime-ai";
import { Provider as JotaiProvider } from "jotai/react";

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
    <JotaiProvider>
      <VoiceClientContext.Provider value={{ voiceClient }}>
        {children}
      </VoiceClientContext.Provider>
    </JotaiProvider>
  );
};
