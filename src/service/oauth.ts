import { type UserData, getUserData, setUserData } from "./users";

import { type AppContext } from "../../constants";
import { type Firestore } from "firebase/firestore";
import { type User } from "firebase/auth";

export const TWITCH_TOKEN_FIELD_NAME = "twitch-access-token";
export const YOUTUBE_ACCESS_TOKEN_FIELD_NAME = "youtube-access-token";
export const YOUTUBE_REFRESH_TOKEN_FIELD_NAME = "youtube-refresh-token";

export const getTwitchToken = async (db: Firestore, user: User) => {
  const data = await getUserData(db, user);
  return data[TWITCH_TOKEN_FIELD_NAME];
};

export const setTwitchToken = async (
  db: Firestore,
  user: User,
  token: string
) => {
  await setUserData(db, user, { [TWITCH_TOKEN_FIELD_NAME]: token });
};

/* eslint-disable camelcase */
export interface YoutubeOauthResponse {
  readonly access_token: string;
  readonly expires_in: number;
  readonly refresh_token?: string;
  readonly scope: string;
  readonly token_type: "Bearer";
}
/* eslint-enable camelcase */

export const validateYoutubeOauthResponse = (
  arg: any
): arg is YoutubeOauthResponse =>
  typeof arg === "object" && "token_type" in arg && arg.token_type === "Bearer";

export interface ExchangeYoutubeTokenParams {
  readonly code: string;
  readonly redirectUri: string;
}

export const exchangeYoutubeToken = async (
  { youtubeCallbackEndpoint }: AppContext,
  user: User,
  { code, redirectUri }: ExchangeYoutubeTokenParams
): Promise<YoutubeOauthResponse> => {
  const query = new URLSearchParams({ code, redirectUri });
  const idToken = await user.getIdToken();
  const response = await fetch(`${youtubeCallbackEndpoint}?${query}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) throw new Error("Invalid response");
  const json = await response.json();
  if (!validateYoutubeOauthResponse(json)) throw new Error("Invalid response");
  return json;
};

export const setYoutubeToken = async (
  user: User,
  db: Firestore,
  params: YoutubeOauthResponse
) => {
  let data: UserData = { [YOUTUBE_ACCESS_TOKEN_FIELD_NAME]: params.access_token };
  if (typeof params.refresh_token !== "undefined") {
    data = { ...data, [YOUTUBE_REFRESH_TOKEN_FIELD_NAME]: params.refresh_token };
  }
  await setUserData(db, user, data);
};

export const getYoutubeToken = async (
  db: Firestore,
  user: User
): Promise<string | undefined> => {
  const data = await getUserData(db, user);
  return data[YOUTUBE_ACCESS_TOKEN_FIELD_NAME];
};

export const refreshYoutubeToken = async (
  { youtubeRefreshEndpoint }: AppContext,
  db: Firestore,
  user: User
): Promise<YoutubeOauthResponse> => {
  const data = await getUserData(db, user);
  const refreshToken = data[YOUTUBE_REFRESH_TOKEN_FIELD_NAME];
  if (typeof refreshToken === "undefined")
    throw new Error("Refresh token not stored");
  const query = new URLSearchParams({ refreshToken });
  const idToken = await user.getIdToken();
  const response = await fetch(`${youtubeRefreshEndpoint}?${query}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (!response.ok) throw new Error("Invalid response");
  const json = await response.json();
  if (!validateYoutubeOauthResponse(json)) throw new Error("Invalid response");
  return json;
};

export const generateNonce = (): string => {
  const array = new Uint32Array(1);
  const generated = crypto.getRandomValues(array);
  const nonce = generated[0].toString(16).padStart(8, "0");
  return nonce;
};
