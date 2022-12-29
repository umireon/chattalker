import {
  DEFAULT_YOUTUBE_CLIENT_SECRET_VERSION,
  YOUTUBE_CLIENT_SECRET_FIELD_NAME,
  getYoutubeClientSecret,
} from "./secret";
import { describe, expect, it, vi } from "vitest";

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

describe.concurrent("getYoutubeClientSecret", () => {
  it("accesses Secret Manager", async () => {
    const accessSecretVersion = vi
      .fn()
      .mockResolvedValue([{ payload: { data: "data" } }]);
    const client = {
      accessSecretVersion,
    } as unknown as InstanceType<typeof SecretManagerServiceClient>;
    const actual = await getYoutubeClientSecret(client, {
      projectId: "projectId",
    });
    expect(actual).toBe("data");
    expect(accessSecretVersion.mock.calls[0][0]).toEqual({
      name: `projects/projectId/secrets/${YOUTUBE_CLIENT_SECRET_FIELD_NAME}/versions/${DEFAULT_YOUTUBE_CLIENT_SECRET_VERSION}`,
    });
  });
});
