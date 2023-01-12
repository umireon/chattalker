import {
  type YoutubeOauthResponse,
  validateYoutubeOauthResponse,
} from "./oauth";
import { describe, expect, it } from "vitest";

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
