import firebase from './initializeApp'

import 'firebase/compat/auth'
import 'firebase/compat/firestore'

const auth = firebase.auth()
const db = firebase.firestore()

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const docRef = await db.collection('users').doc(user.uid).get()
    const token = docRef.data()!.twitch_access_token
    if (token) {
      location.href = '/app.html'
    }
  }
})
