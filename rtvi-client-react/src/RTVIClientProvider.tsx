import { createContext } from "react";

import { Client } from "realtime-ai";
import { Provider as JotaiProvider } from "jotai/react";

interface Props {
  client: Client;
}

export const RTVIClientContext = createContext<{ client?: Client }>({});

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
