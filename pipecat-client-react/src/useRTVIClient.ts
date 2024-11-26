/**
 * Copyright (c) 2024, Daily.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { useContext } from "react";
import { RTVIClientContext } from "./RTVIClientProvider";

export const useRTVIClient = () => {
  const { client } = useContext(RTVIClientContext);
  return client;
};
