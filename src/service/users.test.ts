import { type UserData, extractUserData } from "./users";
import { describe, expect, it } from "vitest";

describe.concurrent("extractUserData", () => {
  it("extracts everything from a valid UserData", () => {
    const userData: UserData = {
      nonce: "1",
      token: "1",
      "twitch-access-token": "1",
      "voice-en": "1",
      "voice-ja": "1",
      "voice-und": "1",
      "youtube-access-token": "1",
      "youtube-refresh-token": "1",
    };
    expect(extractUserData(userData)).toEqual(userData);
  });

  it("removes invalid keys", () => {
    const userData = {
      invalid: "",
    };
    expect(extractUserData(userData)).toEqual({});
  });
});
