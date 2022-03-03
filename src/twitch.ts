import { getAnalytics, logEvent } from 'firebase/analytics'

import { firebaseConfig } from './firebaseConfig'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { setOauthToken } from './service'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const isSet = await setOauthToken(db, user, 'twitch')
    if (isSet) {
      logEvent(analytics, 'twitch_connected')
      location.href = '/app.html'
    } else {
      throw new Error('Could not connect to Twitch')
    }
  }
})
