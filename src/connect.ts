import { CLIENT_ID, listenLogout } from './service'
import { collection, doc, getDoc, getFirestore } from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig'
import { getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
    const data = docRef.data()
    if (typeof data !== 'undefined' && data.twitch_access_token) {
      location.href = '/app.html'
    }
  }
})

listenLogout(auth, document.querySelector('#logout'))

const loginElement = document.querySelector('a')
const twitchOauthQuery = new URLSearchParams({
  client_id: CLIENT_ID,
  redirect_uri: `${location.href.replace(/twitch.html$/, 'app.html')}`,
  response_type: 'token',
  scope: 'chat:read chat:edit'
})
loginElement.href = `https://id.twitch.tv/oauth2/authorize?${twitchOauthQuery}`
