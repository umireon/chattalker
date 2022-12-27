import { type Request, type Response } from "@google-cloud/functions-framework";

import { type App } from "firebase-admin/app";
import { DEFAULT_CONTEXT } from "./constants.js";
import { type ParsedQs } from "qs";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { TranslationServiceClient } from "@google-cloud/translate";
import { coarseIntoUint8Array } from "./service/coarse.js";
import { detectLanguage } from "./service/translate.js";
import { formDataToBlob } from "formdata-polyfill/esm.min.js";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getYoutubeClientSecret } from "./service/secret.js";
import { handleCors } from "./service/cors.js";

const validateVoice = (
  arg: string | ParsedQs | string[] | ParsedQs[] | undefined
): arg is Record<string, string> => {
  if (
    typeof arg === "undefined" ||
    typeof arg === "string" ||
    Array.isArray(arg)
  )
    return false;
  for (const name in arg) {
    if (typeof arg[name] !== "string") return false;
  }
  return true;
};

interface GetVoiceResult {
  readonly languageCode: string;
  readonly name?: string;
}

function getVoice(
  voiceTable: Record<string, string>,
  languageCode: string
): GetVoiceResult {
  if (languageCode in voiceTable) {
    return { languageCode, name: voiceTable[languageCode] };
  } else {
    return { languageCode };
  }
}

export async function textToSpeech(req: Request, res: Response) {
  if (!handleCors(req, res)) return;

  // Validate environment
  const { PROJECT_ID } = process.env;
  if (typeof PROJECT_ID === "undefined")
    throw new Error("PROJECT_ID not provided");

  // Validate query
  if (req.query.keepAlive === "true") {
    res.status(204).send("");
    return;
  }
  if (typeof req.query.text !== "string") {
    res.status(400).send("Invalid text");
    return;
  }
  if (!validateVoice(req.query.voice)) {
    res.status(400).send("Invalid voice");
    return;
  }
  const { text, voice } = req.query;

  // Detect language
  const translationClient = new TranslationServiceClient();
  const language = await detectLanguage(translationClient, {
    content: text,
    projectId: PROJECT_ID,
  });

  // Synthesize speech
  const textToSpeechClient = new TextToSpeechClient();
  const [response] = await textToSpeechClient.synthesizeSpeech({
    audioConfig: { audioEncoding: "MP3" },
    input: { text },
    voice: getVoice(voice, language),
  });
  const { audioContent } = response;
  if (!audioContent) throw new Error("Invalid response");

  // Compose response
  const formData = new FormData();
  formData.append(
    "audioContent",
    new Blob([coarseIntoUint8Array(audioContent)], {
      type: "audio/mpeg",
    })
  );
  formData.append("language", language);
  const blob = formDataToBlob(formData);
  const arrayBuffer = await blob.arrayBuffer();
  res.set("Content-Type", blob.type);
  res.send(Buffer.from(arrayBuffer));
}

export async function youtubeOauth2callback(req: Request, res: Response) {
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
    client_id: DEFAULT_CONTEXT.youtubeClientId,
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

export async function youtubeOauth2refresh(req: Request, res: Response) {
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
  if (typeof req.query.refreshToken !== "string") {
    res.status(400).send("Invalid refreshToken");
    return;
  }
  const { refreshToken } = req.query;

  // Refresh token
  const query = new URLSearchParams({
    client_id: DEFAULT_CONTEXT.youtubeClientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
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

export async function authenticateWithToken(
  app: App,
  req: Request,
  res: Response
) {
  if (!handleCors(req, res)) return;

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Validate query
  if (typeof req.query.token !== "string") {
    res.status(400).send("Invalid token");
    return;
  }
  if (typeof req.query.uid !== "string") {
    res.status(400).send("Invalid uid");
    return;
  }
  const { token, uid } = req.query;

  // Verify token
  const docRef = await db.collection("users").doc(uid).get();
  const data = docRef.data();
  if (!data) throw new Error("Record could not be fetched");
  const expectedToken = data.token;
  if (!expectedToken) throw new Error("token not found");
  if (token !== expectedToken) {
    res.status(401).send({});
    return;
  }

  // Generate custom token
  const customToken = await auth.createCustomToken(uid);
  res.send(customToken);
}
