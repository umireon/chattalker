import {
  connect,
  getTwitchLogin,
  getTwitchToken,
  getUserData,
  listenDisconnect,
  listenLogout,
  listenPlay,
  listenVoiceChange
} from './app-service'

import { firebaseConfig } from './firebaseConfig'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

const ENDPOINT = 'https://text-to-speech-bf7bhumxka-uc.a.run.app/'
const CLIENT_ID = '386m0kveloa87fbla7yivaw38unkft'

listenLogout(auth, document.querySelector('#logout'))

auth.onAuthStateChanged(async (user) => {
  if (user) {
    listenDisconnect(db, user, document.querySelector('#disconnect'))

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

    const twitchToken = await getTwitchToken(db, user)
    if (typeof twitchToken === 'undefined') {
      location.href = '/twitch.html'
    } else {
      const twitchLogin = await getTwitchLogin(CLIENT_ID, twitchToken)
      connect(analytics, ENDPOINT, user, twitchToken, twitchLogin)
    }
  }
})
