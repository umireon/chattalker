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

const ircHandler = (token: string) => {
  const socket = new WebSocket('wss://irc-ws.chat.twitch.tv')
  socket.addEventListener('open', (event) => {
    socket.send(`PASS oauth:${token}`)
    socket.send('NICK umireon')
    socket.send('JOIN #umireon')
  })
  socket.addEventListener('message', async (event) => {
    console.log(event.data)
    const m = event.data.match(/PRIVMSG #umireon :(.*)/)
    if (m) {
      const query = new URLSearchParams({ text: m[1] })
      const response = await fetch(`https://text-to-speech-hypfl7atta-uc.a.run.app?${query}`)
      const data = await response.blob()
      const audioElement = document.querySelector('audio')
      audioElement.src = URL.createObjectURL(data)
      audioElement.play()
    }
  })
  socket.addEventListener('message', async (event) => {
    const m = event.data.match(/PING :tmi.twitch.tv/)
    if (m) {
      socket.send('PONG :tmi.twitch.tv')
    }
  })
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''))
    const token = params.get('access_token')
    if (token) {
      db.collection('users').doc(user.uid).set({ twitch_access_token: token })
      ircHandler(token)
    } else {
      const docRef = await db.collection('users').doc(user.uid).get()
      ircHandler(docRef.data().twitch_access_token)
    }
  }
})
