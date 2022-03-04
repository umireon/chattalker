import { getAnalytics, logEvent } from 'firebase/analytics'

import { firebaseConfig } from './firebaseConfig'
import { getAuth, User } from 'firebase/auth'
// import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
// import { setOauthToken } from './service/oauth'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
// const db = getFirestore(app)
// const analytics = getAnalytics(app)

const setYoutubeToken = async (user: User) => {
  const params = new URLSearchParams(location.search)
  if (params.get('state') !== '12345') throw new Error('Nonce does not match!')
  const code = params.get('code')
  if (code) {
    const idToken = await user.getIdToken()
    const response = await fetch(`https://oauth2callback-bf7bhumxka-uc.a.run.app?${params}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    })
    if (!response.ok) throw new Error('')
    const json = await response.json()
    console.log(json)
    return true
  } else {
    return false
  }
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    setYoutubeToken(user)
  }
})
