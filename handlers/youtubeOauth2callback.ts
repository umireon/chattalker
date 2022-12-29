import { type Request, type Response } from "@google-cloud/functions-framework";

import { type AppContext } from "../constants.js";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { getYoutubeClientSecret } from "../service/secret.js";
import { handleCors } from "../service/cors.js";

export async function youtubeOauth2callback(
  context: AppContext,
  req: Request,
  res: Response
) {
  if (!handleCors(req, res)) return;

  // Validate environment
  const { PROJECT_ID } = process.env;
  if (typeof PROJECT_ID === "undefined")
    throw new Error("PROJECT_ID not provided");
  const secretManagerClient = new SecretManagerServiceClient();
  const clientSecret = await getYoutubeClientSecret(secretManagerClient, {
    projectId: PROJECT_ID,
  });

  // Validate query
  if (typeof req.query.code !== "string") {
    res.status(400).send("Invalid code");
    return;
  }
  if (typeof req.query.redirectUri !== "string") {
    res.status(400).send("Invalid redirectUri");
    return;
  }
  const { code, redirectUri } = req.query;

  // Exchange code
  const query = new URLSearchParams({
    client_id: context.youtubeClientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const response = await fetch("https://accounts.google.com/o/oauth2/token", {
    body: query,
    method: "POST",
  });
  if (!response.ok) {
    const text = await response.text();
    console.log(text);
    throw new Error("Invalid response");
  }
  const json = await response.json();
  res.send(json);
}
