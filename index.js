const functions = require('@google-cloud/functions-framework')
const textToSpeech = require('@google-cloud/text-to-speech')
const { Translate } = require('@google-cloud/translate').v2

const client = new textToSpeech.TextToSpeechClient()
const translate = new Translate()

functions.http('helloHttp', async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')

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
