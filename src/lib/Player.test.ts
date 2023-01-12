import { describe, expect, it } from "vitest";

import Player from "./Player.svelte";
import { render } from "@testing-library/svelte";

describe.concurrent("Player", () => {
  it("matches snapshot", () => {
    const props = {
      playerIsLoading: false,
      playerLanguage: "",
      playerSrc: "",
      playerText: "",
    };
    const component = render(Player, { props });
    expect(component.container).toMatchSnapshot();
  });
});
