import { createContext } from "react";

import { RTVIClient } from "realtime-ai";
import { Provider as JotaiProvider } from "jotai/react";

export interface Props {
  client: RTVIClient;
}

export const RTVIClientContext = createContext<{ client?: RTVIClient }>({});

export const RTVIClientProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  client,
}) => {
  return (
    <JotaiProvider>
      <RTVIClientContext.Provider value={{ client }}>
        {children}
      </RTVIClientContext.Provider>
    </JotaiProvider>
  );
};
RTVIClientProvider.displayName = "RTVIClientProvider";
