import { describe, expect, it, test } from "vitest";

import type { TwitchUsersResponse } from "./twitch";
import { validateTwitchUsersResponse } from "./twitch";

describe("validateTwitchUsersResponse", () => {
  it("agrees with valid TwitchUsersResponse", () => {
    const response: TwitchUsersResponse = {
      data: [
        {
          login: "",
        },
      ],
    };
    expect(validateTwitchUsersResponse(response)).toBeTruthy();
  });

  it("disagrees with invalid data", () => {
    const response = {
      error: "",
    };
    expect(validateTwitchUsersResponse(response)).toBeFalsy();
  });
});
