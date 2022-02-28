const functions = require('@google-cloud/functions-framework')
const textToSpeech = require('@google-cloud/text-to-speech')
const { Translate } = require('@google-cloud/translate').v2
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const client = new textToSpeech.TextToSpeechClient()
const translate = new Translate()
const app = initializeApp()
const auth = getAuth(app)

functions.http('helloHttp', async (req, res) => {
  res.set('Access-Control-Allow-Origin', 'https://umireon-twitch-speech-test1.web.app')

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Authorization')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return
  }

  const idToken = req.headers.authorization.split(' ')[1]
  auth.verifyIdToken(idToken)

  const text = req.query.text
  const [detections] = await translate.detect(text)
  const [{ language }] = Array.isArray(detections) ? detections : [detections]
  console.log(language)
  const languageCode = language === 'und' ? 'en-US' : language

  const request = {
    input: { text },
    voice: { languageCode, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' }
  }
  const [response] = await client.synthesizeSpeech(request)
  res.send(response.audioContent)
})
