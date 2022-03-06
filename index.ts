import { FormData, formDataToBlob } from 'formdata-polyfill/esm.min.js'

import { Blob } from 'fetch-blob'
import { DEFAULT_CONTEXT } from './constants.js'
import type { HttpFunction } from '@google-cloud/functions-framework'
import type { Message } from './types.js'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { TranslationServiceClient } from '@google-cloud/translate'
import { encode } from '@msgpack/msgpack'
import fetch from 'node-fetch'
import { http } from '@google-cloud/functions-framework'

const client = new TextToSpeechClient()
const translationClient = new TranslationServiceClient()

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
  // const message: Message = {
  //   audioContent: coarseUint8Array(audioContent),
  //   language
  // }
  const formData = new FormData()
  formData.append('audioContent', new Blob([coarseUint8Array(audioContent)]))
  formData.append('language', language)
  const blob = formDataToBlob(formData)
  const arrayBuffer = await blob.arrayBuffer()
  res.set('Content-Type', blob.type)
  res.send(arrayBuffer)
})

http('youtube-oauth2callback', async (req, res) => {
  if (!handleCors(req, res)) return

  const { code, redirectUri } = req.query
  if (typeof code !== 'string') throw new Error('Invalid code')
  if (typeof redirectUri !== 'string') throw new Error('Invalid redirectUri')
  const { YOUTUBE_CLIENT_SECRET } = process.env
  if (typeof YOUTUBE_CLIENT_SECRET === 'undefined') throw new Error('YOUTUBE_CLIENT_SECRET not provided')
  const query = new URLSearchParams({
    client_id: DEFAULT_CONTEXT.youtubeClientId,
    client_secret: YOUTUBE_CLIENT_SECRET,
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

  const { refreshToken } = req.query
  if (typeof refreshToken !== 'string') throw new Error('Invalid refreshToken')
  const { YOUTUBE_CLIENT_SECRET } = process.env
  if (typeof YOUTUBE_CLIENT_SECRET === 'undefined') throw new Error('YOUTUBE_CLIENT_SECRET not provided')
  const query = new URLSearchParams({
    client_id: DEFAULT_CONTEXT.youtubeClientId,
    client_secret: YOUTUBE_CLIENT_SECRET,
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
