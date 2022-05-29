export interface AppContext {
  readonly authenticateWithTokenEndpoint: string
  readonly textToSpeechEndpoint: string
  readonly twitchClientId: string
  readonly youtubeCallbackEndpoint: string
  readonly youtubeClientId: string
  readonly youtubeRefreshEndpoint: string
}

export const DEFAULT_CONTEXT: AppContext = {
  authenticateWithTokenEndpoint:
    'https://chattalker-34in68ly.uc.gateway.dev/authenticate-with-token',
  textToSpeechEndpoint:
    'https://chattalker-34in68ly.uc.gateway.dev/text-to-speech',
  twitchClientId: '386m0kveloa87fbla7yivaw38unkft',
  youtubeCallbackEndpoint:
    'https://chattalker-34in68ly.uc.gateway.dev/youtube-oauth2callback',
  youtubeClientId:
    '244926935062-j7pehh8c98tg19crb1ipbugd3ikdrpcn.apps.googleusercontent.com',
  youtubeRefreshEndpoint:
    'https://chattalker-34in68ly.uc.gateway.dev/youtube-oauth2refresh',
}

export const firebaseConfig = {
  apiKey: 'AIzaSyDTH0B1DLTsmWZQRW8aJ7LWswpZ_tnWesE',
  appId: '1:244926935062:web:dd2fe1ec4263d9f74d8537',
  authDomain: 'chattalker.firebaseapp.com',
  measurementId: 'G-T64BRZR9QC',
  messagingSenderId: '244926935062',
  projectId: 'chattalker',
  storageBucket: 'chattalker.appspot.com',
}
