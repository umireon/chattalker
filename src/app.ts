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

const connect = async (user: firebase.User, twitchToken: string) => {
  const userResponse = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${twitchToken}`,
      'Client-Id': '386m0kveloa87fbla7yivaw38unkft'
    }
  })
  const userData = await userResponse.json()
  const { data: [{ login }] } = userData

  const socket = new WebSocket('wss://irc-ws.chat.twitch.tv')
  socket.addEventListener('open', (event) => {
    socket.send(`PASS oauth:${twitchToken}`)
    socket.send(`NICK ${login}`)
    socket.send(`JOIN #${login}`)
  })
  socket.addEventListener('message', async (event) => {
    console.log(event.data)
    const m = event.data.match(new RegExp(`PRIVMSG #${login} :(.*)`))
    if (m) {
      const idToken = await user.getIdToken(true)
      const query = new URLSearchParams({ text: m[1] })
      const response = await fetch(`https://text-to-speech-hypfl7atta-uc.a.run.app?${query}`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      })
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
  socket.addEventListener('close', (event) => {
    console.log('Socket is closed. Reconnect will be attempted in 1 second.', event.reason)
    setTimeout(() => {
      connect(user, twitchToken)
    }, 1000)
  })
  socket.addEventListener('error', (event, err) => {
    console.error('Socket encountered error: ', err.message, 'Closing socket')
    socket.close()
  })
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    const params = new URLSearchParams(location.hash.replace(/^#/, ''))
    const twitchToken = params.get('access_token')
    if (twitchToken) {
      db.collection('users').doc(user.uid).set({ twitch_access_token: twitchToken })
      connect(user, twitchToken)
    } else {
      const docRef = await db.collection('users').doc(user.uid).get()
      connect(user, docRef.data()!.twitch_access_token)
    }
  }
})

document.querySelector('button')?.addEventListener('click', async (e) => {
  await auth.signOut()
  location.href = '/'
})
