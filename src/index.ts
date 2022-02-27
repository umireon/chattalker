import firebase from 'firebase/compat/app'
import firebaseui from 'firebaseui'

import 'firebase/compat/auth'

const ui = new firebaseui.auth.AuthUI(firebase.auth())
console.log(ui)
