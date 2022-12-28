import { expect, test } from 'vitest'

import { type AppContext } from "../../constants";
import Connect from "./Connect.svelte";
import { type Firestore } from "firebase/firestore";
import { type User } from "firebase/auth";
import { render } from "@testing-library/svelte";

test("Connect snapshot", () => {
  const props = {
    context: {} as AppContext,
    db: {} as Firestore,
    user: {} as User,
  };
  const component = render(Connect, { props });
  expect(component.container).toMatchSnapshot();
});
