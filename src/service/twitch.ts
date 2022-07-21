import type { AppContext } from "../../constants";

export interface TwitchUsersData {
  readonly login: string;
}

export interface TwitchUsersResponse {
  readonly data: TwitchUsersData[];
}

export const validateTwitchUsersResponse = (
  arg: any
): arg is TwitchUsersResponse => {
  if (typeof arg === "undefined" || arg === null) return false;
  return Array.isArray(arg.data);
};

export const getTwitchLogin = async (
  { twitchClientId }: AppContext,
  token: string
): Promise<string> => {
  const response = await fetch("https://api.twitch.tv/helix/users", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": twitchClientId,
    },
  });
  if (!response.ok) throw new Error("Twitch login could not be retrieved!");
  const json: unknown = await response.json();
  if (!validateTwitchUsersResponse(json)) throw new Error("Invalid response");
  const {
    data: [{ login }],
  } = json;
  return login;
};

export interface ConnectTwitchParams {
  login: string;
  token: string;
}

type ConnectTwitchCallback = (text: string) => void;

export const connectTwitch = (
  params: ConnectTwitchParams,
  callback: ConnectTwitchCallback
) => {
  const { login, token } = params;
  const socket = new WebSocket("wss://irc-ws.chat.twitch.tv");
  socket.addEventListener("open", () => {
    socket.send(`PASS oauth:${token}`);
    socket.send(`NICK ${login}`);
    socket.send(`JOIN #${login}`);
  });
  socket.addEventListener("message", async (event) => {
    console.log(event.data);
  });
  const privmsgRegexp = new RegExp(`PRIVMSG #${login} :(.*)`);
  socket.addEventListener("message", async (event) => {
    if (typeof event.data === "string") {
      const m = event.data.match(privmsgRegexp);
      if (m !== null && typeof m[1] !== "undefined") {
        callback(m[1]);
      }
    }
  });
  socket.addEventListener("message", async (event) => {
    if (typeof event.data === "string") {
      const m = event.data.match(/PING :tmi.twitch.tv/);
      if (m !== null) {
        socket.send("PONG :tmi.twitch.tv");
      }
    }
  });
  socket.addEventListener("close", (event) => {
    console.log(event);
    setTimeout(() => {
      connectTwitch(params, callback);
    }, 1000);
  });
  socket.addEventListener("error", (event) => {
    console.error(event);
    socket.close();
  });
};
