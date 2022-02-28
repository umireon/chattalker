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
