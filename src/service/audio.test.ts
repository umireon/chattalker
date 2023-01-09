import { describe, expect, it, test } from "vitest";
import type { FetchAutioResponse } from "./audio";
import { handleFetchAudioResponse } from "./audio";

describe("handleFetchAudioResponse", () => {
  it("processes a proper FormData", () => {
    const ok = true;
    const audioContent = new File(["file"], "file.mp3");
    const language = "en";
    const formData = new FormData();
    formData.append("audioContent", audioContent);
    formData.append("language", language);
    const actual = handleFetchAudioResponse(ok, formData);
    const expected: FetchAutioResponse = { audioContent, language };
    expect(actual).toEqual(expected);
  });

  it("throws against invalid audioContent", () => {
    const ok = true;
    const audioContent = "invalid";
    const language = "en";
    const formData = new FormData();
    formData.append("audioContent", audioContent);
    formData.append("language", language);
    expect(() => handleFetchAudioResponse(ok, formData)).toThrow(Error);
  });

  it("throws against invalid language", () => {
    const ok = true;
    const audioContent = new File(["file"], "file.mp3");
    const language = new File(["invalid"], "invalid");
    const formData = new FormData();
    formData.append("audioContent", audioContent);
    formData.append("language", language);
    expect(() => handleFetchAudioResponse(ok, formData)).toThrow(Error);
  });

  it("throws against invalid response", () => {
    const ok = false;
    const formData = new FormData();
    expect(() => handleFetchAudioResponse(ok, formData)).toThrow(Error);
  });
});
