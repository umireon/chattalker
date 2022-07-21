import Voice from './Voice.svelte'
import { render } from '@testing-library/svelte'

test('Player snapshot', () => {
  const props = {
    playAudio: (test: string) => {},
    voiceEn: '',
    voiceJa: '',
    voiceUnd: '',
  }
  const component = render(Voice, { props })
  expect(component.container).toMatchSnapshot()
})
