import { RTVIClientParams, RTVIError } from ".";
import { RTVIActionRequest, RTVIActionResponse } from "./messages";

export async function httpActionGenerator(
  actionUrl: string,
  action: RTVIActionRequest,
  params: RTVIClientParams,
  handleResponse: (response: RTVIActionResponse) => void
): Promise<void> {
  try {
    console.debug("[RTVI] Fetch action", actionUrl, action);

    const headers = new Headers({
      ...Object.fromEntries((params.headers ?? new Headers()).entries()),
    });

    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    headers.set("Cache-Control", "no-cache");
    headers.set("Connection", "keep-alive");

    // Perform the fetch request
    const response = await fetch(actionUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...params.requestData, actions: [action] }),
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
      // Parse streamed responses
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
            handleResponse(parsedData);
          } catch (error) {
            console.error("[RTVI] Failed to parse JSON:", error);
            throw error;
          }

          boundary = buffer.indexOf("\n\n");
        }
      }
    } else {
      // For regular non-streamed responses, parse and handle the data as JSON
      const data = await response.json();
      handleResponse(data);
    }
  } catch (error) {
    console.error("[RTVI] Error during fetch:", error);
    throw error;
  }
}
/*
//@TODO: implement abortController when mode changes / bad things happen
export async function dispatchAction(
  this: RTVIClient,
  action: RTVIActionRequest
): Promise<RTVIActionResponse> {
  const promise = new Promise((resolve, reject) => {
    (async () => {
      if (this.connected) {
        return this._messageDispatcher.dispatch(action);
      } else {
        const actionUrl = this.constructUrl("action");
        try {
          const result = await httpActionGenerator(
            actionUrl,
            action,
            this.params,
            (response) => {
              this.handleMessage(response);
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
*/
