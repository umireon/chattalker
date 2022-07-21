import Logout from "./Logout.svelte";
import { render } from "@testing-library/svelte";

test("Logout snapshot", () => {
  const props = { auth: null };
  const component = render(Logout, { props });
  expect(component.container).toMatchSnapshot();
});
