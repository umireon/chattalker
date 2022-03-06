import { getAnalytics, logEvent } from 'firebase/analytics'

import { firebaseConfig } from '../constants'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { setTwitchToken } from './service/oauth'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const params = new URLSearchParams(location.hash.slice(1))
    const token = params.get('access_token')
    if (token) {
      await setTwitchToken(db, user, token)
      logEvent(analytics, 'twitch_connected')
      location.href = '/app.html'
    } else {
      throw new Error('Could not connect to Twitch')
    }
  }
})
