import firebase from 'firebase/compat/app'
import firebaseui from 'firebaseui'

import 'firebase/compat/auth'

const ui = new firebaseui.auth.AuthUI(firebase.auth())
ui.start('#firebaseui-auth-container', {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ]
})
