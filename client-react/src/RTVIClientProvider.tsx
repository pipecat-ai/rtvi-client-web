/**
 * Copyright (c) 2024, Daily.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { createContext } from "react";

import { RTVIClient } from "@pipecat-ai/client-js";
import { createStore } from "jotai";
import { Provider as JotaiProvider } from "jotai/react";

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
