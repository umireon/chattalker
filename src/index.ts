import firebase from 'firebase/compat/app'
import * as firebaseui from 'firebaseui'

import 'firebase/compat/auth'

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

const ui = new firebaseui.auth.AuthUI(firebase.auth())

const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      return true
    },
    uiShown: function () {
      document.getElementById('loader').style.display = 'none'
    }
  },
  signInSuccessUrl: '/app.html',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ]
}

ui.start('#firebaseui-auth-container', uiConfig)
