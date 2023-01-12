import { describe, expect, it } from "vitest";

import { type Auth } from "firebase/auth";
import Logout from "./Logout.svelte";
import { render } from "@testing-library/svelte";

describe.concurrent("Logout", () => {
  it("matches snapshot", () => {
    const props = { auth: {} as Auth };
    const component = render(Logout, { props });
    expect(component.container).toMatchSnapshot();
  });
});
