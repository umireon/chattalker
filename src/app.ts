import { ENDPOINT, TWITCH_CLIENT_ID, YOUTUBE_CLIENT_ID } from './constants'
import { connectTwitch, getTwitchLogin } from './service/twitch'
import { listenLogout, listenPlay, listenVoiceChange } from './service/ui'

import { firebaseConfig } from './firebaseConfig'
import { getActiveLiveChatIds } from './service/youtube'
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

interface LiveChatMessageResponse {
  nextPageToken: string
  pollingIntervalMillis: number
}

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
      const liveChatIds = await getActiveLiveChatIds(youtubeToken)
      console.log(liveChatIds)
      const a = async (liveChatId: string, pageToken: string = undefined) => {
        const query = new URLSearchParams({
          liveChatId,
          part: 'id,snippet,authorDetails'
        })
        if (pageToken) {
          query.set('pageToken', pageToken)
        }
        const response = await fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?${query}`, {
          headers: {
            Authorization: `Bearer ${youtubeToken}`
          }
        })
        if (!response.ok) throw new Error('Error')
        const json: LiveChatMessageResponse = await response.json()
        const { nextPageToken, pollingIntervalMillis } = json
        return { nextPageToken, pollingIntervalMillis }
      }
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
