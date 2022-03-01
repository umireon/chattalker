import type { Message } from './types'
import type { ParsedQs } from 'qs'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { TranslationServiceClient } from '@google-cloud/translate'
import { encode } from '@msgpack/msgpack'
import { getAuth } from 'firebase-admin/auth'
import { http } from '@google-cloud/functions-framework'
import { initializeApp } from 'firebase-admin/app'

const client = new TextToSpeechClient()
const translationClient = new TranslationServiceClient()
const app = initializeApp()
const auth = getAuth(app)

const projectId = process.env.PROJECT_ID
if (typeof projectId === 'undefined') throw new Error('PROJECT_ID not defined')

const detectLanguage = async (content: string) => {
  const [response] = await translationClient.detectLanguage({
    content,
    parent: `projects/${projectId}/locations/global`
  })
  const { languages } = response
  if (!languages) return 'und'
  const [{ languageCode }] = languages
  return languageCode || 'und'
}

const coarseUint8Array = (data: Uint8Array | string): Uint8Array => {
  if (typeof data === 'string') {
    const encoder = new TextEncoder()
    return encoder.encode(data)
  } else {
    return data
  }
}

const extractFirstQuery = (param: string | ParsedQs | string[] | ParsedQs[]) => {
  if (Array.isArray(param)) {
    return param[0].toString()
  } else {
    return param.toString()
  }
}

const extractVoiceTable = (param: string | ParsedQs | string[] | ParsedQs[] | undefined) => {
  if (typeof param === 'undefined') {
    return {}
  } else if (Array.isArray(param)) {
    return JSON.parse(param[0].toString())
  } else {
    return JSON.parse(param.toString())
  }
}

const getVoice = (voiceTable: Record<string, string>, languageCode: string) => {
  if (languageCode in voiceTable) {
    return { languageCode, name: voiceTable[languageCode] }
  } else {
    return { languageCode }
  }
}

http('text-to-speech', async (req, res) => {
  // Begin of handling CORS
  const { origin } = req.headers
  if (typeof origin !== 'undefined') {
    const { hostname } = new URL(origin)
    if (hostname === 'localhost') {
      res.set('Access-Control-Allow-Origin', '*')
    } else {
      res.set('Access-Control-Allow-Origin', 'https://umireon-twitch-speech-test1.web.app')
    }
  }

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Authorization')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return
  }
  // End of handling CORS

  // Begin of authorization
  const { authorization } = req.headers
  if (typeof authorization === 'undefined') {
    res.status(403).send('Forbidden')
    return
  }
  const idToken = authorization.split(' ')[1]
  if (typeof idToken === 'undefined') {
    res.status(403).send('Forbidden')
    return
  }
  try {
    await auth.verifyIdToken(idToken)
  } catch (error) {
    res.status(403).send('Forbidden')
    return
  }
  // End of authorization

  if (typeof req.query.text === 'undefined') {
    res.status(400).send('Bad Request')
    return
  }
  const text = extractFirstQuery(req.query.text)
  const voiceTable = extractVoiceTable(req.query.voiceTable)
  const language = await detectLanguage(text)

  const [response] = await client.synthesizeSpeech({
    audioConfig: { audioEncoding: 'MP3' },
    input: { text },
    voice: getVoice(voiceTable, language)
  })

  const { audioContent } = response
  if (!audioContent) {
    res.status(500).send('Internal Server Error')
    return
  }
  const message: Message = {
    audioContent: coarseUint8Array(audioContent),
    language,
    text
  }
  res.send(Buffer.from(encode(message)))
})
