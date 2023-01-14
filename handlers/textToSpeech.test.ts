import { type Request, type Response } from "@google-cloud/functions-framework";
import { describe, expect, it, vi } from "vitest";
import { textToSpeech, validateVoice } from "./textToSpeech";

import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { TranslationServiceClient } from "@google-cloud/translate";
import { corsGet } from "./testHelper";

describe.concurrent("validateVoice", () => {
  it("return true if arg is a map", () => {
    expect(validateVoice({ key: "value" })).toBeTruthy()
  })

  it("return false if arg is not a map", () => {
    expect(validateVoice(undefined)).toBeFalsy()
    expect(validateVoice("string")).toBeFalsy()
    expect(validateVoice(["string1", "string2"])).toBeFalsy()
    expect(validateVoice({ key1: { key2: "value"} })).toBeFalsy()
  })
})

describe.concurrent("textToSpeech", () => {
  it("returns audioContent", async () => {
    const languageCode = "languageCode";
    const voiceName = "voiceName";

    const text = "text";
    const voice = {
      [languageCode]: voiceName,
    };

    const req = {
      get: corsGet,
      query: {
        text,
        voice,
      },
    } as unknown as Request;

    const resSend = vi.fn();
    const resSet = vi.fn();
    const res = {
      send: resSend,
      set: resSet,
    } as unknown as Response;

    const PROJECT_ID = "projectId";
    const env = { PROJECT_ID };

    const translationClientDetectLanguage = vi.fn().mockResolvedValue([
      {
        languages: [{ languageCode }],
      },
    ]);
    const translationClient = {
      detectLanguage: translationClientDetectLanguage,
    } as unknown as InstanceType<typeof TranslationServiceClient>;

    const audioContent = "audioContent";
    const textToSpeechClientSynthesizeSpeech = vi.fn().mockResolvedValue([
      {
        audioContent,
      },
    ]);
    const textToSpeechClient = {
      synthesizeSpeech: textToSpeechClientSynthesizeSpeech,
    } as unknown as InstanceType<typeof TextToSpeechClient>;

    await textToSpeech(req, res, env, translationClient, textToSpeechClient);
    expect(translationClientDetectLanguage.mock.calls[0][0]).toEqual({
      content: text,
      parent: `projects/${PROJECT_ID}/locations/global`,
    });
    expect(textToSpeechClientSynthesizeSpeech.mock.calls[0][0]).toEqual({
      audioConfig: { audioEncoding: "MP3" },
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
      },
    });
    expect(resSet.mock.calls[1][0]).toBe("Content-Type");
    expect(resSet.mock.calls[1][1]).toContain("multipart/form-data");
    const decoder = new TextDecoder();
    const actual = decoder.decode(resSend.mock.calls[0][0]);
    expect(actual).toContain(audioContent);
  });

  it("returns audioContent when voice is not specified", async () => {
    const text = "text";
    const req = {
      get: corsGet,
      query: {
        text,
        voice: { und: "" }
      },
    } as unknown as Request;

    const resSend = vi.fn();
    const resSet = vi.fn();
    const res = {
      send: resSend,
      set: resSet,
    } as unknown as Response;

    const PROJECT_ID = "projectId";
    const env = { PROJECT_ID };

    const translationClientDetectLanguage = vi.fn().mockResolvedValue([
      {
        languages: [{ languageCode: "xx" }],
      },
    ]);
    const translationClient = {
      detectLanguage: translationClientDetectLanguage,
    } as unknown as InstanceType<typeof TranslationServiceClient>;

    const audioContent = "audioContent";
    const textToSpeechClientSynthesizeSpeech = vi.fn().mockResolvedValue([
      {
        audioContent,
      },
    ]);
    const textToSpeechClient = {
      synthesizeSpeech: textToSpeechClientSynthesizeSpeech,
    } as unknown as InstanceType<typeof TextToSpeechClient>;

    await textToSpeech(req, res, env, translationClient, textToSpeechClient);
    expect(translationClientDetectLanguage.mock.calls[0][0]).toEqual({
      content: text,
      parent: `projects/${PROJECT_ID}/locations/global`,
    });
    expect(textToSpeechClientSynthesizeSpeech.mock.calls[0][0]).toEqual({
      audioConfig: { audioEncoding: "MP3" },
      input: { text },
      voice: {
        languageCode: "xx",
      },
    });
    expect(resSet.mock.calls[1][0]).toBe("Content-Type");
    expect(resSet.mock.calls[1][1]).toContain("multipart/form-data");
    const decoder = new TextDecoder();
    const actual = decoder.decode(resSend.mock.calls[0][0]);
    expect(actual).toContain(audioContent);
  });

  it("accepts keep alive requests", async () => {
    const keepAlive = "true";

    const req = {
      get: corsGet,
      query: {
        keepAlive,
      },
    } as unknown as Request;

    const resSend = vi.fn();
    const resSet = vi.fn();
    const resStatus = vi.fn().mockReturnValue({ send: resSend });
    const res = {
      set: resSet,
      status: resStatus,
    } as unknown as Response;

    const PROJECT_ID = "projectId";
    const env = { PROJECT_ID };

    await textToSpeech(req, res, env);
    expect(resStatus.mock.calls[0][0]).toBe(204);
    expect(resSend.mock.calls[0][0]).toBe("");
  });
});
