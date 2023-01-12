import {
  type TwitchUsersResponse,
  validateTwitchUsersResponse,
} from "./twitch";

import { describe, expect, it } from "vitest";

describe.concurrent("validateTwitchUsersResponse", () => {
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
