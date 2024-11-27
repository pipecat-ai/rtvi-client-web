import { createContext } from "react";

import { RTVIClient } from "realtime-ai";
import { Provider as JotaiProvider } from "jotai/react";
import { createStore } from "jotai";

export interface Props {
  client: RTVIClient;
  jotaiStore?: React.ComponentProps<typeof JotaiProvider>["store"];
}

const defaultStore = createStore();

export const RTVIClientContext = createContext<{ client?: RTVIClient }>({});

export const RTVIClientProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  client,
  jotaiStore = defaultStore,
}) => {
  return (
    <JotaiProvider store={jotaiStore}>
      <RTVIClientContext.Provider value={{ client }}>
        {children}
      </RTVIClientContext.Provider>
    </JotaiProvider>
  );
};
RTVIClientProvider.displayName = "RTVIClientProvider";
