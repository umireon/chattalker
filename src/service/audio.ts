import type { AppContext } from '../../constants'
import type { User } from 'firebase/auth'

export const fetchAudio = async ({ textToSpeechEndpoint }: AppContext, user: User, text: string) => {
  const idToken = await user.getIdToken(true)
  const query = new URLSearchParams({ text })
  const form = document.querySelector('form')
  if (form !== null) {
    for (const [key, value] of new FormData(form)) {
      if (typeof value === 'string') {
        query.append(key, value)
      }
    }
  }
  const response = await fetch(`${textToSpeechEndpoint}?${query}`, {
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  })
  if (!response.ok) throw new Error('Invalid message')
  const formData = await response.formData()
  const audioContent = formData.get('audioContent')
  const language = formData.get('language')
  if (typeof audioContent === 'string' || audioContent === null) throw new Error('Invalid audioContent')
  if (typeof language !== 'string') throw new Error('Invalid language')
  return { audioContent, language }
}
