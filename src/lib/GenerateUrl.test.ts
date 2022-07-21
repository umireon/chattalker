import GenerateUrl from './GenerateUrl.svelte'
import { render } from '@testing-library/svelte'

test('GenerateUrl snapshot', () => {
  const props = { db: null, user: null }
  const component = render(GenerateUrl, { props })
  expect(component.container).toMatchSnapshot()
})
