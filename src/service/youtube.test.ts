import type {
  YoutubeLiveBroadcastResponse,
  YoutubeLiveChatMessageResponse,
} from "./youtube";
import {
  YoutubeRequestError,
  handleYoutubeLiveBroadcastResponse,
  handleYoutubeLiveChatMessageResponse,
} from "./youtube";
import { describe, expect, it, test } from "vitest";

describe("handleYoutubeLiveBroadcastResponse", () => {
  it("processes a valid YoutubeLiveBroadcastResponse", () => {
    const ok = true;
    const liveChatId = "id";
    const response: YoutubeLiveBroadcastResponse = {
      items: [
        {
          snippet: { liveChatId },
          status: {
            lifeCycleStatus: "live",
          },
        },
      ],
    };
    expect(handleYoutubeLiveBroadcastResponse(ok, response)).toEqual([
      liveChatId,
    ]);
  });

  it("throws against an invalid data", () => {
    const ok = true;
    const response = {
      items: "invalid",
    };
    expect(() => handleYoutubeLiveBroadcastResponse(ok, response)).toThrow(
      Error
    );
  });

  it("throws against a quota error", () => {
    const ok = false;
    const response = {
      error: {
        errors: [
          {
            domain: "youtube.quota",
          },
        ],
      },
    };
    expect(() => handleYoutubeLiveBroadcastResponse(ok, response)).toThrow(
      Error
    );
  });

  it("throws against the token expired error", () => {
    const ok = false;
    const response = {
      error: {
        errors: [
          {
            domain: "youtube.token_expired",
          },
        ],
      },
    };
    expect(() => handleYoutubeLiveBroadcastResponse(ok, response)).toThrow(
      YoutubeRequestError
    );
  });
});

describe("handleYoutubeLiveChatMessageResponse", () => {
  it("processes a valid YoutubeLiveChatMessageResponse", () => {
    const ok = true;
    const response: YoutubeLiveChatMessageResponse = {
      items: [
        {
          snippet: {
            publishedAt: "2000-01-01T00:00:00Z",
          },
        },
      ],
      nextPageToken: "",
      pollingIntervalMillis: 0,
    };
    expect(handleYoutubeLiveChatMessageResponse(ok, response)).toEqual(
      response
    );
  });

  it("throws against an invalid data", () => {
    const ok = true;
    const response = {
      items: "invalid",
    };
    expect(() => handleYoutubeLiveChatMessageResponse(ok, response)).toThrow(
      Error
    );
  });

  it("throws against a quota error", () => {
    const ok = false;
    const response = {
      error: {
        errors: [
          {
            domain: "youtube.quota",
          },
        ],
      },
    };
    expect(() => handleYoutubeLiveChatMessageResponse(ok, response)).toThrow(
      Error
    );
  });

  it("throws against the token expired error", () => {
    const ok = false;
    const response = {
      error: {
        errors: [
          {
            domain: "youtube.token_expired",
          },
        ],
      },
    };
    expect(() => handleYoutubeLiveChatMessageResponse(ok, response)).toThrow(
      YoutubeRequestError
    );
  });
});
