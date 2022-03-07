import { AppContext } from '../../constants'
import { User } from 'firebase/auth'
import { fetchAudio } from './audio'

test('a', async () => {
  const context = { textToSpeechEndpoint: 'ENDPOINT' } as AppContext
  const user = {} as User
  const text = 'TEXT'
  await fetchAudio(context, user, text)
})
