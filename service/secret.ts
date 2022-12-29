import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { coarseIntoString } from "./coarse.js";

export const YOUTUBE_CLIENT_SECRET_FIELD_NAME = "twitch-oauth-token";
export const DEFAULT_YOUTUBE_CLIENT_SECRET_VERSION = "1";

export interface GetYoutubeClientSecretOption {
  readonly name?: string;
  readonly projectId: string;
  readonly version?: string;
}

export async function getYoutubeClientSecret(
  client: SecretManagerServiceClient,
  {
    name = YOUTUBE_CLIENT_SECRET_FIELD_NAME,
    projectId,
    version = DEFAULT_YOUTUBE_CLIENT_SECRET_VERSION,
  }: GetYoutubeClientSecretOption
) {
  const [response] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/${version}`,
  });
  if (!response.payload || !response.payload.data)
    throw new Error("Invalid response");
  return coarseIntoString(response.payload.data);
}
