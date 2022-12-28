import { expect, test } from "vitest";

import Voice from "./Voice.svelte";
import { render } from "@testing-library/svelte";

test("Player snapshot", () => {
  const props = {
    playAudio: (_: string) => {},
    voiceEn: "",
    voiceJa: "",
    voiceUnd: "",
  };
  const component = render(Voice, { props });
  expect(component.container).toMatchSnapshot();
});
