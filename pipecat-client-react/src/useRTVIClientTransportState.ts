/**
 * Copyright (c) 2024, Daily.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { TransportState, RTVIEvent } from "realtime-ai";
import { useRTVIClientEvent } from "./useRTVIClientEvent";
import { atom, useAtom } from "jotai";

const transportStateAtom = atom<TransportState>("disconnected");

export const useRTVIClientTransportState = () => {
  const [transportState, setTransportState] = useAtom(transportStateAtom);

  useRTVIClientEvent(RTVIEvent.TransportStateChanged, setTransportState);

  return transportState;
};
