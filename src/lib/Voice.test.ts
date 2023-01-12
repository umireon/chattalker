import { describe, expect, it } from "vitest";

import Voice from "./Voice.svelte";
import { render } from "@testing-library/svelte";

describe.concurrent("Voice", () => {
  it("matches snapshot", () => {
    const props = {
      playAudio: (_: string) => {},
      voiceEn: "",
      voiceJa: "",
      voiceUnd: "",
    };
    const component = render(Voice, { props });
    expect(component.container).toMatchSnapshot();
  });
});
