import { DEFAULT_CONTEXT, firebaseConfig } from '../constants'
import { connectTwitch, getTwitchLogin } from './service/twitch'
import { getOauthToken, getYoutubeToken } from './service/oauth'
import { listenLogout, listenPlay, listenVoiceChange } from './service/ui'

import { connectYoutube } from './service/youtube'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getUserData } from './service/users'
import { initializeApp } from 'firebase/app'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

listenLogout(auth, document.querySelector('#logout'))

auth.onAuthStateChanged(async (user) => {
  if (user) {
    for (const element of document.querySelectorAll<HTMLButtonElement>('button.play')) {
      listenPlay(DEFAULT_CONTEXT, user, element)
    }

    const data = await getUserData(db, user)
    for (const element of document.querySelectorAll('select')) {
      listenVoiceChange(db, user, element)
      if (typeof data !== 'undefined' && typeof data[element.id] === 'string') {
        element.value = data[element.id]
      }
    }

    const twitchToken = await getOauthToken(db, user, 'twitch')
    if (typeof twitchToken !== 'undefined') {
      const twitchLogin = await getTwitchLogin(DEFAULT_CONTEXT, twitchToken)
      connectTwitch(DEFAULT_CONTEXT, analytics, user, {
        login: twitchLogin,
        token: twitchToken
      })
    }

    const youtubeToken = await getYoutubeToken(db, user)
    if (typeof youtubeToken !== 'undefined') {
      connectYoutube(DEFAULT_CONTEXT, db, analytics, user, { token: youtubeToken })
    }
  }
})

const twitchConnectElement = document.querySelector<HTMLAnchorElement>('a#connect-twitch')
const twitchOauthQuery = new URLSearchParams({
  client_id: DEFAULT_CONTEXT.twitchClientId,
  redirect_uri: `${location.origin}${location.pathname}`.replace(/app.html$/, 'twitch.html'),
  response_type: 'token',
  scope: 'chat:read'
})
twitchConnectElement.href = `https://id.twitch.tv/oauth2/authorize?${twitchOauthQuery}`

const youtubeConnectElement = document.querySelector<HTMLAnchorElement>('a#connect-youtube')
const youtubeOauthQuery = new URLSearchParams({
  access_type: 'offline',
  client_id: DEFAULT_CONTEXT.youtubeClientId,
  redirect_uri: `${location.origin}${location.pathname}`.replace(/app.html$/, 'youtube.html'),
  response_type: 'code',
  scope: 'https://www.googleapis.com/auth/youtube.readonly'
})
youtubeConnectElement.href = `https://accounts.google.com/o/oauth2/auth?${youtubeOauthQuery}`
