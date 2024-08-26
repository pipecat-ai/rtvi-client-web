import {
  View,
  SafeAreaView,
  StyleSheet,
  Text,
  Button,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import { RNDailyVoiceClient } from 'react-native-rtvi-client-daily';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f9fa",
    width: "100%",
  },
  outCallContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inCallContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  dailyMediaView: {
    flex: 1,
    aspectRatio: 9 / 16,
  },
  roomUrlInput: {
    borderRadius: 8,
    marginVertical: 8,
    padding: 12,
    fontStyle: "normal",
    fontWeight: "normal",
    borderWidth: 1,
    width: "100%",
  },
  infoView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  controlButton: {
    flex: 1,
  },
});

const ROOM_URL_TEMPLATE = process.env.EXPO_PUBLIC_BASE_URL;

export default function App() {
  const [roomUrl, setRoomUrl] = useState(ROOM_URL_TEMPLATE);
  const [voiceClient, setVoiceClient] = useState<RNDailyVoiceClient|undefined>();

  const start = async () => {
    console.log("Starting the bot");
    try {
      await voiceClient?.start()
    } catch (e) {
      console.log("Failed to join the call", e)
    }
  };

  //Add the listeners
  useEffect(() => {
    if (!voiceClient) {
      return;
    }
    voiceClient
      .on("transportStateChanged", (state) => {
        console.log("New state", state)
      })
      .on("error", (error) => {
        console.log("error", error)
      })
    return () => {};
  }, [voiceClient]);

  // Create the VoiceClient
  useEffect(() => {
    let voiceClient = new RNDailyVoiceClient({
      baseUrl: process.env.EXPO_PUBLIC_BASE_URL,
      enableMic: true,
      services: {
        llm: "together",
        tts: "cartesia",
      },
      config: [
        {
          service: "tts",
          options: [
            { name: "voice", value: "79a125e8-cd45-4c13-8a67-188112f4dd22" },
          ],
        },
        {
          service: "llm",
          options: [
            { name: "model", value: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" },
            {
              name: "initial_messages",
              value: [
                {
                  role: "system",
                  content:
                    "You are a assistant called Frankie. You can ask me anything. Keep responses brief and legible. Introduce yourself first.",
                },
              ],
            },
            { name: "run_on_config", value: true },
          ],
        },
      ],
      customHeaders: {
          "Authorization": `Bearer ${process.env.EXPO_PUBLIC_DAILY_API_KEY}`
      },
      customBodyParams: {
        "bot_profile": "voice_2024_08",
        "max_duration": 680
      },
      timeout: 15 * 1000,
      enableCam: false,
    })
    console.log("Initializing, VoiceClient")
    setVoiceClient(voiceClient)
    return () => {};
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.outCallContainer}>
          <View style={styles.infoView}>
            <Text>Not in a call yet</Text>
            <TextInput
              style={styles.roomUrlInput}
              value={roomUrl}
              onChangeText={(newRoomURL) => {
                setRoomUrl(newRoomURL);
              }}
            />
            <Button
              style={styles.controlButton}
              onPress={() => start()}
              title="Start"
            ></Button>
          </View>
        </View>
    </SafeAreaView>
  );
}
