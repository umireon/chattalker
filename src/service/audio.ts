import type { AppContext } from '../../constants'
import type { User } from 'firebase/auth'

export const VOICE_KEYS = ['voice[en]', 'voice[ja]', 'voice[und]'] as const
export type VoiceKeys = typeof VOICE_KEYS[number]
export interface Voice {
  readonly 'voice[en]'?: string
  readonly 'voice[ja]'?: string
  readonly 'voice[und]'?: string
}

export interface FetchAutioResponse {
  readonly audioContent: File
  readonly language: string
}

export const handleFetchAudioResponse = (
  ok: boolean,
  formData: FormData
): FetchAutioResponse => {
  if (!ok) throw new Error('Invalid response')
  const audioContent = formData.get('audioContent')
  const language = formData.get('language')
  if (typeof audioContent === 'string' || audioContent === null)
    throw new Error('Invalid audioContent')
  if (typeof language !== 'string') throw new Error('Invalid language')
  return { audioContent, language }
}

export const fetchAudio = async (
  { textToSpeechEndpoint }: AppContext,
  user: User,
  voice: Voice,
  text: string
): Promise<FetchAutioResponse> => {
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
      Authorization: `Bearer ${idToken}`,
    },
  })
  const formData = await response.formData()
  return handleFetchAudioResponse(response.ok, formData)
}

export const sendKeepAliveToTextToSpeech = async (
  { textToSpeechEndpoint }: AppContext,
  user: User
): Promise<boolean> => {
  const idToken = await user.getIdToken(true)
  const query = new URLSearchParams({ keepAlive: 'true' })
  const response = await fetch(`${textToSpeechEndpoint}?${query}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })
  return response.ok
}
