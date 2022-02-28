import { http } from '@google-cloud/functions-framework'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { TranslationServiceClient } from '@google-cloud/translate'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { encode } from '@msgpack/msgpack'
import type { Message } from './types'

const client = new TextToSpeechClient()
const translationClient = new TranslationServiceClient();
const app = initializeApp()
const auth = getAuth(app)

const detectLanguage = async (content: string) => {
  const [response] = await translationClient.detectLanguage({ content })
  const { languages } = response
  if (!languages) return 'und'
  const [ { languageCode } ] = languages
  return languageCode || 'und'
}

const getVoice = (languageCode: string) => {
  if (languageCode === 'und') {
    return { languageCode: 'en' }
  } else {
    return { languageCode }
  }
}

const coarseUint8Array = (data: Uint8Array | string): Uint8Array => {
  if (typeof data === 'string') {
    const encoder = new TextEncoder()
    return encoder.encode(data)
  } else {
    return data
  }
}

http('helloHttp', async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://umireon-twitch-speech-test1.web.app')

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Authorization')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return
  }

  const { authorization } = req.headers
  if (typeof authorization === 'undefined') throw new Error('error')
  const idToken = authorization.split(' ')[1]
  auth.verifyIdToken(idToken)

  const text = req.query.text
  if (typeof text !== 'string') throw new Error('Error')
  const language = await detectLanguage(text)

  const [response] = await client.synthesizeSpeech({
    audioConfig: { audioEncoding: 'MP3' },
    input: { text },
    voice: getVoice(language)
  })

  const { audioContent } = response
  if (!audioContent) throw new Error('error')
  const message: Message = {
    audioContent: coarseUint8Array(audioContent),
    language,
    text
  }
  res.send(Buffer.from(encode(message)))
})
