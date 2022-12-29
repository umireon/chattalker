import { type Request, type Response } from "@google-cloud/functions-framework";

import { type ParsedQs } from "qs";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { TranslationServiceClient } from "@google-cloud/translate";
import { coarseIntoUint8Array } from "../service/coarse.js";
import { detectLanguage } from "../service/translate.js";
import { formDataToBlob } from "formdata-polyfill/esm.min.js";
import { handleCors } from "../service/cors.js";

export function validateVoice(
  arg: string | ParsedQs | string[] | ParsedQs[] | undefined
): arg is Record<string, string> {
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
}

interface GetVoiceResult {
  readonly languageCode: string;
  readonly name?: string;
}

export function getVoice(
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
