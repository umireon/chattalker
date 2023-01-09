import { describe, expect, it, test } from "vitest";

import type { YoutubeOauthResponse } from "./oauth";
import { validateYoutubeOauthResponse } from "./oauth";

describe.concurrent("validateYoutubeOauthResponse", () => {
  it("agrees with valid YoutubeOauthResponse", () => {
    const response: YoutubeOauthResponse = {
      access_token: "",
      expires_in: 0,
      scope: "",
      token_type: "Bearer",
    };
    expect(validateYoutubeOauthResponse(response)).toBeTruthy();
  });

  it("agrees with valid YoutubeOauthResponse", () => {
    const response = {
      error: "",
    };
    expect(validateYoutubeOauthResponse(response)).toBeFalsy();
  });
});
