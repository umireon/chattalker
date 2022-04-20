import * as firebaseui from "firebaseui";

import firebase from "firebase/compat/app";

import { firebaseConfig } from "../constants";

import "firebase/compat/auth";
import "firebaseui/dist/firebaseui.css";

firebase.initializeApp(firebaseConfig);

const ui = new firebaseui.auth.AuthUI(firebase.auth());

firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    location.href = "app.html";
  } else {
    ui.start("#firebaseui-auth-container", {
      callbacks: {
        signInSuccessWithAuthResult: () => true,
      },
      signInOptions: [firebase.auth.EmailAuthProvider.PROVIDER_ID],
      signInSuccessUrl: "app.html",
    });
  }
});
