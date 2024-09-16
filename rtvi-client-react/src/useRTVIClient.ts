import { useContext } from "react";
import { RTVIClientContext } from "./RTVIClientProvider";

export const useRTVIClient = () => {
  const { client } = useContext(RTVIClientContext);
  return client;
};
