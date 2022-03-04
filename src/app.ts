import { ENDPOINT, TWITCH_CLIENT_ID, YOUTUBE_CLIENT_ID } from './constants'
import { connectTwitch, getTwitchLogin } from './service/twitch'
import { listenLogout, listenPlay, listenVoiceChange } from './service/ui'

import { firebaseConfig } from './firebaseConfig'
import { getActiveLiveChatIds, pollLiveChatMessages } from './service/youtube'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getOauthToken } from './service/oauth'
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
      listenPlay(ENDPOINT, user, element)
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
      const twitchLogin = await getTwitchLogin(TWITCH_CLIENT_ID, twitchToken)
      connectTwitch(analytics, ENDPOINT, user, twitchToken, twitchLogin)
    }

    const youtubeToken = await getOauthToken(db, user, 'youtube')
    if (typeof youtubeToken !== 'undefined') {
      const youtubeMain = async () => {
        for await (const items of pollLiveChatMessages(youtubeToken)) {
          console.log(items)
        }
      }
      youtubeMain()
    }
  }
})

const twitchConnectElement = document.querySelector<HTMLAnchorElement>('a#connect-twitch')
const twitchOauthQuery = new URLSearchParams({
  client_id: TWITCH_CLIENT_ID,
  redirect_uri: `${location.href.replace(/app.html$/, 'twitch.html')}`,
  response_type: 'token',
  scope: 'chat:read'
})
twitchConnectElement.href = `https://id.twitch.tv/oauth2/authorize?${twitchOauthQuery}`

const youtubeConnectElement = document.querySelector<HTMLAnchorElement>('a#connect-youtube')
const youtubeOauthQuery = new URLSearchParams({
  client_id: YOUTUBE_CLIENT_ID,
  redirect_uri: `${location.href.replace(/app.html$/, 'youtube.html')}`,
  response_type: 'token',
  scope: 'https://www.googleapis.com/auth/youtube.readonly'
})
youtubeConnectElement.href = `https://accounts.google.com/o/oauth2/auth?${youtubeOauthQuery}`
