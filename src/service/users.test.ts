import { describe, expect, it, test } from "vitest";

import type { UserData } from "./users";
import { extractUserData } from "./users";

describe("extractUserData", () => {
  it("extracts everything from a valid UserData", () => {
    const userData: UserData = {
      nonce: "",
      token: "",
      "twitch-access-token": "",
      "voice-en": "",
      "voice-ja": "",
      "voice-und": "",
      "youtube-access-token": "",
      "youtube-refresh-token": "",
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
