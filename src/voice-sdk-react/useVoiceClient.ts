import { useContext } from "react";
import { VoiceClientContext } from "./VoiceClientProvider";

export const useVoiceClient = () => {
  const { voiceClient } = useContext(VoiceClientContext);
  return voiceClient;
};
