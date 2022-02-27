import firebase from 'firebase/compat/app'

import 'firebase/compat/auth'
import 'firebase/compat/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAUej-VTeNFs6slwLE3M0J0NBz0BNdFODA',
  authDomain: 'umireon-twitch-speech-test1.firebaseapp.com',
  projectId: 'umireon-twitch-speech-test1',
  storageBucket: 'umireon-twitch-speech-test1.appspot.com',
  messagingSenderId: '110679332753',
  appId: '1:110679332753:web:8cdf3d0736e80293aeec30',
  measurementId: 'G-Q8Y6670GB8'
}

firebase.initializeApp(firebaseConfig)

const auth = firebase.auth()
const db = firebase.firestore()

auth.onAuthStateChanged((user) => {
  if (user) {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''))
    const token = params.get('access_token')
    db.collection('users').doc(user.uid).set({ twitch_access_token: token })
    console.log(token)
  }
})
