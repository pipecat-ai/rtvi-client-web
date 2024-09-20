import { describe, expect, jest, test } from "@jest/globals";

import { RTVIVoiceClient } from "../src";
import { RTVIActionRequestData, RTVIActionResponse } from "../src/actions";
import { TransportStub } from "./stubs/transport";

jest.mock("nanoid", () => {
  return {
    nanoid: () => "123",
  };
});

const client = new RTVIVoiceClient({
  params: {
    baseUrl: new URL("http://localhost"),
  },
  transport: TransportStub,
});

describe("Action Resolver", () => {
  test("Client.connected should return correctly based on state", async () => {
    expect(client.connected).toBe(false);

    await client.connect();

    expect(client.connected).toBe(true);

    client.disconnect();

    expect(client.connected).toBe(false);
  });
});

describe("Disconnected actions", () => {
  test("Client.action", async () => {
    // Set a valid URL
    client.params.baseUrl = new URL("http://127.0.0.1:8000/api/completions");

    // Action request object
    const action: RTVIActionRequestData = {
      service: "test",
      action: "test",
    };

    // Test if client.action returns a promise
    const result: RTVIActionResponse = await client.action(action);
    console.log(result);
  });

  test("Client.action should resolve on resolution", async () => {});
});
