import type { AppContext } from '../../constants'
import type { User } from 'firebase/auth'

export const VOICE_KEYS = ['voice[en]', 'voice[ja]', 'voice[und]'] as const
export type VoiceKeys = typeof VOICE_KEYS[number]
export interface Voice {
  readonly 'voice[en]'?: string
  readonly 'voice[ja]'?: string
  readonly 'voice[und]'?: string
}

export const readVoiceFromPlayer = (form: HTMLFormElement) => {
  let voice: Voice = {}
  const formData = new FormData(form)
  for (const key of VOICE_KEYS) {
    const value = formData.get(key)
    if (value !== null) {
      voice = { ...voice, [key]: value }
    }
  }
  return voice
}

export const fetchAudio = async ({ textToSpeechEndpoint }: AppContext, user: User, voice: Voice, text: string) => {
  const idToken = await user.getIdToken(true)
  const query = new URLSearchParams({ text })
  for (const key of VOICE_KEYS) {
    const value = voice[key]
    if (typeof value !== 'undefined') {
      query.append(key, value)
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
