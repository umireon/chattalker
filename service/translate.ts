import { TranslationServiceClient } from "@google-cloud/translate";

export interface DetectLanguageOption {
  content: string;
  projectId: string;
}

export async function detectLanguage(
  client: TranslationServiceClient,
  { content, projectId }: DetectLanguageOption
): Promise<string> {
  const [response] = await client.detectLanguage({
    content,
    parent: `projects/${projectId}/locations/global`,
  });
  const { languages } = response;
  if (!languages) return "und";
  const [{ languageCode }] = languages;
  return languageCode || "und";
}
