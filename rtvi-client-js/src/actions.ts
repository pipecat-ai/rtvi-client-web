import { nanoid } from "nanoid";

import { RTVIClient, RTVIClientParams } from "./clients";
import { RTVIError } from "./errors";

export const RTVI_ACTION_LABEL = "rtvi-ai";
export const RTVI_ACTION_TYPE = "action";

export type RTVIActionRequestData = {
  service: string;
  action: string;
  arguments?: { name: string; value: unknown }[];
};

export class RTVIActionRequest {
  id: string;
  label: string;
  type: string;
  data: RTVIActionRequestData;

  constructor(data: RTVIActionRequestData) {
    this.id = nanoid(8);
    this.label = RTVI_ACTION_LABEL;
    this.type = RTVI_ACTION_TYPE;
    this.data = data;
  }
}

export type RTVIActionResponse = {
  id: string;
  label: string;
  type: string;
  data: { result: unknown };
};

async function httpActionGenerator(
  params: RTVIClientParams,
  action: RTVIActionRequest,
  handleResponse: (response: RTVIActionResponse) => void
): Promise<void> {
  try {
    console.debug("[RTVI] Fetch action", params.baseUrl.toString(), action);

    const headers = params.headers || new Headers();

    // Ensure the "Content-Type" header is always set to "application/json"
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");

    // Perform the fetch request
    const response = await fetch(params.baseUrl.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(action),
    });

    // Check the response content type
    const contentType = response.headers.get("content-type");

    // Handle non-ok response status
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new RTVIError(
        `Failed to resolve action: ${errorMessage}`,
        response.status
      );
    }

    if (response.body && contentType?.includes("text/event-stream")) {
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;

        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const message = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);

          // Split on the first ":" to extract the JSON part
          const lines = message.split("\n");
          let encodedData = "";
          for (const line of lines) {
            const colonIndex = line.indexOf(":");
            if (colonIndex !== -1) {
              encodedData += line.slice(colonIndex + 1).trim();
            }
          }

          try {
            const jsonData = atob(encodedData);
            const parsedData = JSON.parse(jsonData);
            console.info(parsedData);
            // handleResponse(parsedData);
          } catch (error) {
            console.error("Failed to parse JSON:", error);
          }

          boundary = buffer.indexOf("\n\n");
        }
      }
      // @TODO: return result here (if necessary)
    } else {
      // For regular non-streamed responses, parse and handle the data as JSON
      const data = await response.json();
      handleResponse(data);
    }
  } catch (error) {
    console.error("Error during fetch:", error);
    throw error;
  }
}

//@TODO: implement abortController when mode changes / bad things happen
export async function dispatchAction(
  this: RTVIClient,
  action: RTVIActionRequest
): Promise<RTVIActionResponse> {
  const promise = new Promise((resolve, reject) => {
    (async () => {
      if (["connected", "ready"].includes(this.state)) {
        console.log("Send connected action");
        this._transport.sendMessage(action);
      } else {
        try {
          const result = await httpActionGenerator(
            this.params,
            action,
            (response) => {
              console.log("Response", response);
            }
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
    })();
  });

  return promise as Promise<RTVIActionResponse>;
}
