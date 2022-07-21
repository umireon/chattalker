import Connect from "./Connect.svelte";
import { render } from "@testing-library/svelte";

test("Connect snapshot", () => {
  const props = { context: null, db: null, user: null };
  const component = render(Connect, { props });
  expect(component.container).toMatchSnapshot();
});
