import { describe, expect, it } from "vitest";

import { type Firestore } from "firebase/firestore";
import GenerateUrl from "./GenerateUrl.svelte";
import { type User } from "firebase/auth";
import { render } from "@testing-library/svelte";

describe.concurrent("GenerateUrl", () => {
  it("matches snapshot", () => {
    const props = { db: {} as Firestore, user: {} as User };
    const component = render(GenerateUrl, { props });
    expect(component.container).toMatchSnapshot();
  });
});
