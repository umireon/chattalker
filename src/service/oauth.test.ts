import type { YoutubeOauthResponse } from "./oauth";
import { validateYoutubeOauthResponse } from "./oauth";

test("validateYoutubeOauthResponse agrees with valid YoutubeOauthResponse", () => {
  const response: YoutubeOauthResponse = {
    access_token: "",
    expires_in: 0,
    scope: "",
    token_type: "Bearer",
  };
  expect(validateYoutubeOauthResponse(response)).toBeTruthy();
});

test("validateYoutubeOauthResponse disagrees with invalid data", () => {
  const response = {
    error: "",
  };
  expect(validateYoutubeOauthResponse(response)).toBeFalsy();
});
