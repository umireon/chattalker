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

  console.log(req.headers)
  // auth.verifyIdToken()

  const text = req.query.text
  let [detections] = await translate.detect(text)
  detections = Array.isArray(detections) ? detections : [detections]

  const request = {
    input: { text: text },
    voice: { languageCode: detections[0].language, ssmlGender: 'NEUTRAL' },
    audioConfig: { audioEncoding: 'MP3' }
  }
  const [response] = await client.synthesizeSpeech(request)
  res.send(response.audioContent)
})
