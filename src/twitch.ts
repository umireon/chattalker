import { firebaseConfig } from './firebaseConfig'
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, doc, getDoc } from 'firebase/firestore'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
    const token = docRef.data()!.twitch_access_token
    if (token) {
      location.href = '/app.html'
    }
  }
})
