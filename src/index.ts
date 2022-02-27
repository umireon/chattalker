import firebase from 'firebase/compat/app'
import firebaseui from 'firebaseui'

import 'firebase/compat/auth'

var ui = new firebaseui.auth.AuthUI(firebase.auth());
