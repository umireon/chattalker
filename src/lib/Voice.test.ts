import { describe, expect, it, test } from "vitest";

import Voice from "./Voice.svelte";
import { render } from "@testing-library/svelte";

describe("Voice", () => {
  it("matches snapshot", () => {
    const props = {
      playAudio: (_: string) => {},
      voiceEn: "",
      voiceJa: "",
      voiceUnd: "",
    };
    const component = render(Voice, { props });
    expect(component.container).toMatchSnapshot();
  })
})
