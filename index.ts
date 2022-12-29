import { DEFAULT_CONTEXT } from "./constants.js";
import { authenticateWithToken } from "./handlers/authenticateWithToken.js";
import { http } from "@google-cloud/functions-framework";
import { initializeApp } from "firebase-admin/app";
import { textToSpeech } from "./handlers/textToSpeech.js";
import { youtubeOauth2callback } from "./handlers/youtubeOauth2callback.js";
import { youtubeOauth2refresh } from "./handlers/youtubeOauth2refresh.js";

// Initialize environment
const app = initializeApp();

http("authenticate-with-token", authenticateWithToken.bind(undefined, app));
http("text-to-speech", textToSpeech);
http(
  "youtube-oauth2callback",
  youtubeOauth2callback.bind(undefined, DEFAULT_CONTEXT)
);
http(
  "youtube-oauth2refresh",
  youtubeOauth2refresh.bind(undefined, DEFAULT_CONTEXT)
);
