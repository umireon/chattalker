import firebase from 'firebase/compat/app'

import { firebaseConfig } from './firebaseConfig'
import * as firebaseui from 'firebaseui'

import 'firebase/compat/auth'
import 'firebaseui/dist/firebaseui.css'

firebase.initializeApp(firebaseConfig)

const ui = new firebaseui.auth.AuthUI(firebase.auth())

const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: () => true
  },
  signInSuccessUrl: '/twitch.html',
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ]
}

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    location.href = '/twitch.html'
  } else {
    ui.start('#firebaseui-auth-container', uiConfig)
  }
})
