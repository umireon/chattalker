import { exchangeYoutubeToken, setYoutubeToken } from './service/youtube'
import { getAnalytics, logEvent } from 'firebase/analytics'

import { firebaseConfig } from './firebaseConfig'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    if (!code) throw new Error('Invalid code')
    const oauthResponse = await exchangeYoutubeToken(user, {
      code,
      redirectUri: `${location.origin}${location.pathname}`
    })
    await setYoutubeToken(user, db, oauthResponse)
    logEvent(analytics, 'youtube_connected')
    location.href = '/app.html'
  }
})
