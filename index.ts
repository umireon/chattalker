import type { Request, Response } from 'express'

import FormData = require('form-data')
import type { Message } from './types.js'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { TranslationServiceClient } from '@google-cloud/translate'
import { YOUTUBE_CLIENT_ID } from './constants.js'
import { encode } from '@msgpack/msgpack'
import fetch from 'node-fetch'
import { getAuth } from 'firebase-admin/auth'
import { http } from '@google-cloud/functions-framework'
import { initializeApp } from 'firebase-admin/app'

const client = new TextToSpeechClient()
const translationClient = new TranslationServiceClient()
const app = initializeApp()
const auth = getAuth(app)

const handleCors = (req: Request, res: Response) => {
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

const handleAuthorization = async (req: Request, res: Response) => {
  const { authorization } = req.headers
  if (typeof authorization === 'undefined') {
    res.status(403).send('Forbidden')
    return false
  }
  const idToken = authorization.split(' ')[1]
  if (typeof idToken === 'undefined') {
    res.status(403).send('Forbidden')
    return false
  }
  try {
    await auth.verifyIdToken(idToken)
  } catch (error) {
    res.status(403).send('Forbidden')
    return false
  }
  return true
}

const detectLanguage = async (projectId: string, content: string) => {
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

const getVoice = (voiceTable: Record<string, string>, languageCode: string) => {
  if (languageCode in voiceTable) {
    return { languageCode, name: voiceTable[languageCode] }
  } else {
    return { languageCode }
  }
}

http('text-to-speech', async (req, res) => {
  if (!handleCors(req, res)) return
  if (!await handleAuthorization(req, res)) return

  if (typeof req.query.text === 'undefined') {
    res.status(400).send('Bad Request')
    return
  }
  const text = req.query.text as string
  const voiceTable = (req.query.voice || {}) as Record<string, string>
  const { PROJECT_ID } = process.env
  const language = await detectLanguage(PROJECT_ID, text)

  const [response] = await client.synthesizeSpeech({
    audioConfig: { audioEncoding: 'OGG_OPUS' },
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
    language
  }
  res.send(Buffer.from(encode(message)))
})

http('oauth2callback', async (req, res) => {
  if (!handleCors(req, res)) return
  if (!await handleAuthorization(req, res)) return

  const { code } = req.query
  if (typeof code !== 'string') throw new Error('Invalid code')
  const { YOUTUBE_CLIENT_SECRET } = process.env
  const formData = new FormData()
  formData.append('code', code)
  formData.append('client_id', YOUTUBE_CLIENT_ID)
  formData.append('client_secret', YOUTUBE_CLIENT_SECRET)
  formData.append('grant_type', 'authorization_code')
  const response = await fetch('https://accounts.google.com/o/oauth2/token', {
    body: formData,
    method: 'POST'
  })
  if (!response.ok) throw new Error('Invalid response')
  const jsonText = response.text()
  res.send(jsonText)
})
