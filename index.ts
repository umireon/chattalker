import { http } from '@google-cloud/functions-framework'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { v2 } from '@google-cloud/translate'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { encode } from '@msgpack/msgpack'

const client = new TextToSpeechClient()
const translate = new v2.Translate()
const app = initializeApp()
const auth = getAuth(app)

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
  const [detections] = await translate.detect(text)
  const [{ language }] = Array.isArray(detections) ? detections : [detections]
  const languageCode = language === 'und' ? 'en-US' : language as string

  const [response] = await client.synthesizeSpeech({
    audioConfig: { audioEncoding: 'MP3' },
    input: { text },
    voice: { languageCode }
  })
  res.send(Buffer.from(encode({
    audioContent: response.audioContent,
    language,
    text
  })))
})
