import { DEFAULT_CONTEXT, firebaseConfig } from '../constants'
import { exchangeYoutubeToken, setYoutubeToken } from './service/oauth'
import { getAnalytics, logEvent } from 'firebase/analytics'

import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getUserData } from './service/users'
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

    const userData = await getUserData(db, user)
    if (typeof userData.nonce === 'undefined') throw new Error('Nonce not stored')
    const expectedState = userData.nonce
    const actualState = params.get('state')
    if (actualState !== expectedState) throw new Error('Nonce does not match')

    const oauthResponse = await exchangeYoutubeToken(DEFAULT_CONTEXT, user, {
      code,
      redirectUri: `${location.origin}${location.pathname}`
    })
    await setYoutubeToken(user, db, oauthResponse)
    logEvent(analytics, 'youtube_connected')
    location.href = '/app.html'
  }
})
