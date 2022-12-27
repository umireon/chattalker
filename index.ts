import {
  authenticateWithToken,
  textToSpeech,
  youtubeOauth2callback,
  youtubeOauth2refresh,
} from "./handlers.js";

import { http } from "@google-cloud/functions-framework";
import { initializeApp } from "firebase-admin/app";

// Initialize environment
const app = initializeApp();

http("authenticate-with-token", authenticateWithToken.bind(undefined, app));
http("text-to-speech", textToSpeech);
http("youtube-oauth2callback", youtubeOauth2callback);
http("youtube-oauth2refresh", youtubeOauth2refresh);
