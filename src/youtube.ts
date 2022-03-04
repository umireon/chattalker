import { collection, doc, getFirestore, setDoc } from 'firebase/firestore'
import { getAnalytics, logEvent } from 'firebase/analytics'

import type { Firestore } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import { firebaseConfig } from './firebaseConfig'
import { getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

/* eslint-disable camelcase */
interface OauthResponse {
  readonly access_token: string
  readonly expires_in: number
  readonly refresh_token: string
  readonly token_type: 'Bearer'
}
/* eslint-enable camelcase */

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

const checkIfOauthResponse = (arg: unknown): arg is OauthResponse => typeof arg === 'object' && arg.token_type === 'Bearer'

const exchangeYoutubeToken = async (user: User, params: { readonly code: string, readonly redirectUri: string}) => {
  const query = new URLSearchParams(params)
  const idToken = await user.getIdToken()
  const response = await fetch(`https://oauth2callback-bf7bhumxka-uc.a.run.app?${query}`, {
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  })
  if (!response.ok) throw new Error('Invalid response')
  const json: unknown = await response.json()
  if (!checkIfOauthResponse(json)) throw new Error('Invalid response')
  return json
}

const setYoutubeToken = async (user: User, db: Firestore, params: OauthResponse) => {
  const { access_token: accessToken, refresh_token: refreshToken } = params
  await setDoc(doc(collection(db, 'users'), user.uid), {
    'youtube-access-token': accessToken,
    'youtube-refresh-token': refreshToken
  }, { merge: true })
}

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
    location.href = '/app.html'
  }
})
