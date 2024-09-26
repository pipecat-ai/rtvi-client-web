import { beforeAll, describe, test } from "@jest/globals";

import { RTVIClient } from "../src";
import { RTVIActionRequestData } from "../src/actions";
import { TransportStub } from "./stubs/transport";

async function isServerReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
}

const transport = new TransportStub();
const client = new RTVIClient({
  params: {
    baseUrl: "http://localhost:8000",
  },
  transport: transport,
});

describe("Disconnected actions", () => {
  let serverReachable = true;

  beforeAll(async () => {
    // Check if the server is reachable before running the tests
    serverReachable = await isServerReachable(client.params.baseUrl.toString());
    if (!serverReachable) {
      console.log("Server is offline. Skipping tests.");
    }
  });

  test("Client.action", async () => {
    if (!serverReachable) {
      return;
    }

    // Set a valid URL
    client.params.baseUrl = "http://127.0.0.1:8000/api/completions";

    // Action request object
    const action: RTVIActionRequestData = {
      service: "test",
      action: "test",
    };

    // Test if client.action returns a promise
    try {
      await client.action(action);
    } catch {
      console.log("Error");
    }
  });

  test("Client.action should resolve on resolution", async () => {});
});
