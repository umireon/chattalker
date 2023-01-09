import { describe, expect, it, test } from "vitest";

import { type AppContext } from "../../constants";
import Connect from "./Connect.svelte";
import { type Firestore } from "firebase/firestore";
import { type User } from "firebase/auth";
import { render } from "@testing-library/svelte";

describe("Connect", () => {
  it("matches snapshot", () => {
    const props = {
      context: {} as AppContext,
      db: {} as Firestore,
      user: {} as User,
    };
    const component = render(Connect, { props });
    expect(component.container).toMatchSnapshot();
  });
});
