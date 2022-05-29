import { getAnalytics, logEvent } from 'firebase/analytics'

import { firebaseConfig } from '../constants'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getUserData } from './service/users'
import { initializeApp } from 'firebase/app'
import { setTwitchToken } from './service/oauth'

import 'three-dots/dist/three-dots.min.css'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const params = new URLSearchParams(location.hash.slice(1))

    const token = params.get('access_token')
    if (!token) throw new Error('access_token missing')

    const userData = await getUserData(db, user)
    if (typeof userData.nonce === 'undefined')
      throw new Error('Nonce not stored')
    const expectedState = userData.nonce
    const actualState = params.get('state')
    if (actualState !== expectedState) throw new Error('Nonce does not match')

    await setTwitchToken(db, user, token)
    logEvent(analytics, 'twitch_connected')
    location.href = 'app.html'
  }
})

setTimeout(() => {
  const resetElement = document.querySelector('button')
  if (resetElement === null) throw new Error('Reset button not found')
  resetElement.disabled = false
}, 20000)
