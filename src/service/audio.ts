import type { AppContext } from '../../constants'
import type { Message } from '../../types'
import type { User } from 'firebase/auth'
import { decode } from '@msgpack/msgpack'

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
  const arrayBuffer = await response.arrayBuffer()
  return decode(arrayBuffer) as Message
}
