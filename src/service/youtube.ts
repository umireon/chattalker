import { refreshYoutubeToken, setYoutubeToken } from "./oauth";

import type { AppContext } from "../../constants";
import type { Firestore } from "firebase/firestore";
import type { User } from "firebase/auth";

export class YoutubeRequestError extends Error {}

export interface YoutubeLiveBroadcastSnippet {
  readonly liveChatId: string;
}

export interface YoutubeLiveBroadcastStatus {
  readonly lifeCycleStatus: string;
}

export interface YoutubeLiveBroadcastResource {
  readonly snippet: YoutubeLiveBroadcastSnippet;
  readonly status: YoutubeLiveBroadcastStatus;
}

export interface YoutubeLiveBroadcastResponse {
  readonly items: YoutubeLiveBroadcastResource[];
}

const checkIfQuotaError = (json: any) => {
  if (!json.error) return false;
  if (!Array.isArray(json.error.errors)) return false;
  if (!json.error.errors[0]) return false;
  if (json.error.errors[0].domain !== "youtube.quota") return false;
  return true;
};

export const validateYoutubeLiveBroadcastResponse = (
  arg: any
): arg is YoutubeLiveBroadcastResponse => Array.isArray(arg.items);

export const handleYoutubeLiveBroadcastResponse = (
  ok: boolean,
  json: any
): string[] => {
  if (!ok) {
    if (checkIfQuotaError(json)) {
      throw new Error("Quota error");
    } else {
      throw new YoutubeRequestError("Request failed");
    }
  }
  if (!validateYoutubeLiveBroadcastResponse(json))
    throw new Error("Invalid response");
  const liveItems = json.items.filter((e) =>
    ["live", "ready"].includes(e.status.lifeCycleStatus)
  );
  return liveItems.map(({ snippet: { liveChatId } }) => liveChatId);
};

export const getActiveLiveChatIds = async (
  token: string
): Promise<string[]> => {
  const query = new URLSearchParams({
    broadcastType: "all",
    maxResults: "10",
    mine: "true",
    part: "snippet,contentDetails,status",
  });
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/liveBroadcasts?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const json = await response.json();
  return handleYoutubeLiveBroadcastResponse(response.ok, json);
};

export interface YoutubeLiveChatMessageSnippet {
  readonly displayMessage?: string;
  readonly publishedAt: string;
}

export interface YoutubeLiveChatMessageResource {
  readonly snippet: YoutubeLiveChatMessageSnippet;
}

export interface YoutubeLiveChatMessageResponse {
  readonly items: YoutubeLiveChatMessageResource[];
  readonly nextPageToken: string;
  readonly pollingIntervalMillis: number;
}

export const validateYoutubeLiveChatMessageResponse = (
  arg: any
): arg is YoutubeLiveChatMessageResponse =>
  typeof arg.nextPageToken === "string";

export const handleYoutubeLiveChatMessageResponse = (
  ok: boolean,
  json: any
): YoutubeLiveChatMessageResponse => {
  if (!ok) {
    if (checkIfQuotaError(json)) {
      throw new Error("Quota error");
    } else {
      throw new YoutubeRequestError("Request failed");
    }
  }
  if (!validateYoutubeLiveChatMessageResponse(json))
    throw new Error("Invalid response");
  return json;
};

export const getLiveChatMessages = async (
  token: string,
  liveChatId: string,
  pageToken: string
): Promise<YoutubeLiveChatMessageResponse> => {
  const query = new URLSearchParams({
    liveChatId,
    part: "id,snippet,authorDetails",
  });
  if (pageToken) {
    query.set("pageToken", pageToken);
  }
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/liveChat/messages?${query}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const json = await response.json();
  return handleYoutubeLiveChatMessageResponse(response.ok, json);
};

export async function* pollLiveChatMessages(
  token: string
): AsyncGenerator<YoutubeLiveChatMessageResource[]> {
  let pageTokens: Record<string, string> = {};
  while (true) {
    const liveChatIds = await getActiveLiveChatIds(token);
    const result = await Promise.all(
      liveChatIds.map((liveChatId) =>
        getLiveChatMessages(token, liveChatId, pageTokens[liveChatId])
      )
    );
    const interval = Math.max(...result.map((e) => e.pollingIntervalMillis));
    pageTokens = Object.fromEntries(
      result.map((e, i) => [liveChatIds[i], e.nextPageToken])
    );
    yield result.flatMap((e) => e.items);
    await new Promise((resolve) => {
      setTimeout(resolve, interval);
    });
  }
}

interface ConnectYoutubeParams {
  token: string;
}

export const connectYoutube = async (
  context: AppContext,
  db: Firestore,
  user: User,
  params: ConnectYoutubeParams,
  callback: (text: string) => void
) => {
  const { token } = params;
  try {
    for await (const items of pollLiveChatMessages(token)) {
      for (const item of items) {
        const displayMessage = item.snippet.displayMessage;
        const chatTime = new Date(item.snippet.publishedAt).getTime();
        const freshTime = new Date().getTime() - 10 * 1000;
        if (chatTime > freshTime && typeof displayMessage !== "undefined") {
          callback(displayMessage);
        }
      }
    }
  } catch (e) {
    if (e instanceof YoutubeRequestError) {
      const oauthResponse = await refreshYoutubeToken(context, db, user);
      await setYoutubeToken(user, db, oauthResponse);
      connectYoutube(
        context,
        db,
        user,
        { ...params, token: oauthResponse.access_token },
        callback
      );
    } else {
      throw e;
    }
  }
};
