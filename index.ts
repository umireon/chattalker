import { FormData, formDataToBlob } from 'formdata-polyfill/esm.min.js'

import { Blob } from 'fetch-blob'
import { DEFAULT_CONTEXT } from './constants.js'
import type { HttpFunction } from '@google-cloud/functions-framework'
import type { ParsedQs } from 'qs'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { TranslationServiceClient } from '@google-cloud/translate'
import fetch from 'node-fetch'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { http } from '@google-cloud/functions-framework'
import { initializeApp } from 'firebase-admin/app'

const handleCors: HttpFunction = (req, res) => {
  const { origin } = req.headers
  if (typeof origin !== 'undefined') {
    const { hostname } = new URL(origin)
    if (hostname === 'localhost') {
      res.set('Access-Control-Allow-Origin', '*')
    } else {
      res.set('Access-Control-Allow-Origin', 'https://chattalker.web.app')
    }
  }

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Authorization')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return false
  }

  return true
}

interface DetectLanguageOption {
  projectId: string
  content: string
}

const detectLanguage = async (client: TranslationServiceClient, { projectId, content }: DetectLanguageOption) => {
  const [response] = await client.detectLanguage({
    content,
    parent: `projects/${projectId}/locations/global`
  })
  const { languages } = response
  if (!languages) return 'und'
  const [{ languageCode }] = languages
  return languageCode || 'und'
}

const coarseIntoUint8Array = (data: Uint8Array | string): Uint8Array => {
  if (typeof data === 'string') {
    const encoder = new TextEncoder()
    return encoder.encode(data)
  } else {
    return data
  }
}

const getVoice = (voiceTable: Record<string, string>, languageCode: string) => {
  if (languageCode in voiceTable) {
    return { languageCode, name: voiceTable[languageCode] }
  } else {
    return { languageCode }
  }
}

interface GetYoutubeClientSecretOption {
  readonly name?: string
  readonly projectId: string
  readonly version?: string
}

const DEFAULT_YOUTUBE_CLIENT_SECRET_VERSION = '1'

const coarseIntoString = (data: Uint8Array | string): string => {
  if (typeof data === 'string') {
    return data
  } else {
    const decoder = new TextDecoder()
    return decoder.decode(data)
  }
}

const getYoutubeClientSecret = async (client: SecretManagerServiceClient, {
  name = 'youtube-client-secret',
  projectId,
  version = DEFAULT_YOUTUBE_CLIENT_SECRET_VERSION
}: GetYoutubeClientSecretOption) => {
  const [response] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/${version}`
  })
  if (!response.payload || !response.payload.data) throw new Error('Invalid response')
  return coarseIntoString(response.payload.data)
}

const validateVoice = (arg: string | ParsedQs | string[] | ParsedQs[] | undefined): arg is Record<string, string> => {
  if (typeof arg === 'undefined' || typeof arg === 'string' || Array.isArray(arg)) return false
  for (const name in arg) {
    if (typeof arg[name] !== 'string') return false
  }
  return true
}

// Initialize environment
const app = initializeApp()

http('text-to-speech', async (req, res) => {
  if (!handleCors(req, res)) return

  // Validate environment
  const { PROJECT_ID } = process.env
  if (typeof PROJECT_ID === 'undefined') throw new Error('PROJECT_ID not provided')

  // Validate query
  if (req.query.keepAlive === 'true') {
    res.status(204).send('')
    return
  }
  if (typeof req.query.text !== 'string') {
    res.status(400).send('Invalid text')
    return
  }
  if (!validateVoice(req.query.voice)) {
    res.status(400).send('Invalid voice')
    return
  }
  const { text, voice } = req.query

  // Detect language
  const translationClient = new TranslationServiceClient()
  const language = await detectLanguage(translationClient, { content: text, projectId: PROJECT_ID })

  // Synthesize speech
  const textToSpeechClient = new TextToSpeechClient()
  const [response] = await textToSpeechClient.synthesizeSpeech({
    audioConfig: { audioEncoding: 'MP3' },
    input: { text },
    voice: getVoice(voice, language)
  })
  const { audioContent } = response
  if (!audioContent) throw new Error('Invalid response')

  // Compose response
  const formData = new FormData()
  formData.append('audioContent', new Blob([coarseIntoUint8Array(audioContent)], {
    type: 'audio/mpeg'
  }))
  formData.append('language', language)
  const blob = formDataToBlob(formData)
  const arrayBuffer = await blob.arrayBuffer()
  res.set('Content-Type', blob.type)
  res.send(Buffer.from(arrayBuffer))
})

http('youtube-oauth2callback', async (req, res) => {
  if (!handleCors(req, res)) return

  // Validate environment
  const { PROJECT_ID } = process.env
  if (typeof PROJECT_ID === 'undefined') throw new Error('PROJECT_ID not provided')
  const secretManagerClient = new SecretManagerServiceClient()
  const clientSecret = await getYoutubeClientSecret(secretManagerClient, { projectId: PROJECT_ID })

  // Validate query
  if (typeof req.query.code !== 'string') {
    res.status(400).send('Invalid code')
    return
  }
  if (typeof req.query.redirectUri !== 'string') {
    res.status(400).send('Invalid redirectUri')
    return
  }
  const { code, redirectUri } = req.query

  // Exchange code
  const query = new URLSearchParams({
    client_id: DEFAULT_CONTEXT.youtubeClientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  })
  const response = await fetch('https://accounts.google.com/o/oauth2/token', {
    body: query,
    method: 'POST'
  })
  if (!response.ok) {
    const text = await response.text()
    console.log(text)
    throw new Error('Invalid response')
  }
  const json = await response.json()
  res.send(json)
})

http('youtube-oauth2refresh', async (req, res) => {
  if (!handleCors(req, res)) return

  // Validate environment
  const { PROJECT_ID } = process.env
  if (typeof PROJECT_ID === 'undefined') throw new Error('PROJECT_ID not provided')
  const secretManagerClient = new SecretManagerServiceClient()
  const clientSecret = await getYoutubeClientSecret(secretManagerClient, { projectId: PROJECT_ID })

  // Validate query
  if (typeof req.query.refreshToken !== 'string') {
    res.status(400).send('Invalid refreshToken')
    return
  }
  const { refreshToken } = req.query

  // Refresh token
  const query = new URLSearchParams({
    client_id: DEFAULT_CONTEXT.youtubeClientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  })
  const response = await fetch('https://oauth2.googleapis.com/token', {
    body: query,
    method: 'POST'
  })
  if (!response.ok) {
    const text = await response.text()
    console.log(text)
    throw new Error('Invalid response')
  }
  const json = await response.json()
  res.send(json)
})

http('authenticate-with-token', async (req, res) => {
  if (!handleCors(req, res)) return

  const auth = getAuth(app)
  const db = getFirestore(app)

  // Validate query
  if (typeof req.query.token !== 'string') {
    res.status(400).send('Invalid token')
    return
  }
  if (typeof req.query.uid !== 'string') {
    res.status(400).send('Invalid uid')
    return
  }
  const { token, uid } = req.query

  // Verify token
  const docRef = await db.collection('users').doc(uid).get()
  const data = docRef.data()
  if (!data) throw new Error('Record could not be fetched')
  const expectedToken = data.token
  if (!expectedToken) throw new Error('token not found')
  if (token !== expectedToken) {
    res.status(401).send({})
    return
  }

  // Generate custom token
  const customToken = await auth.createCustomToken(uid)
  res.send(customToken)
})
