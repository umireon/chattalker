import { describe, expect, it, vi } from "vitest";

import { TranslationServiceClient } from "@google-cloud/translate";
import { detectLanguage } from "./translate";

describe.concurrent("detectLanguage", () => {
  it("returns und if no languages were found", async () => {
    const content = "content";
    const projectId = "projectId";
    const clientDetectLanguage = vi.fn().mockResolvedValue([{}]);
    const client = {
      detectLanguage: clientDetectLanguage,
    } as unknown as InstanceType<typeof TranslationServiceClient>;
    const actual = await detectLanguage(client, { content, projectId });
    expect(actual).toBe("und");
    expect(clientDetectLanguage.mock.calls[0][0]).toEqual({
      content,
      parent: `projects/${projectId}/locations/global`,
    });
  });

  it("returns und if no languageCode was found", async () => {
    const content = "content";
    const projectId = "projectId";
    const clientDetectLanguage = vi.fn().mockResolvedValue([
      {
        languages: [{}],
      },
    ]);
    const client = {
      detectLanguage: clientDetectLanguage,
    } as unknown as InstanceType<typeof TranslationServiceClient>;
    const actual = await detectLanguage(client, { content, projectId });
    expect(actual).toBe("und");
    expect(clientDetectLanguage.mock.calls[0][0]).toEqual({
      content,
      parent: `projects/${projectId}/locations/global`,
    });
  });

  it("returns languageCode if a language was found", async () => {
    const content = "content";
    const projectId = "projectId";
    const languageCode = "languageCode";
    const clientDetectLanguage = vi.fn().mockResolvedValue([
      {
        languages: [{ languageCode }],
      },
    ]);
    const client = {
      detectLanguage: clientDetectLanguage,
    } as unknown as InstanceType<typeof TranslationServiceClient>;
    const actual = await detectLanguage(client, { content, projectId });
    expect(actual).toBe(languageCode);
    expect(clientDetectLanguage.mock.calls[0][0]).toEqual({
      content,
      parent: `projects/${projectId}/locations/global`,
    });
  });
});
