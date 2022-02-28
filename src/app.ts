import firebase from './initializeApp'

import 'firebase/compat/auth'
import 'firebase/compat/firestore'

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

  const listen = () => {
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv')
    ws.addEventListener('open', () => {
      ws.send(`PASS oauth:${twitchToken}`)
      ws.send(`NICK ${login}`)
      ws.send(`JOIN #${login}`)
    })
    ws.addEventListener('message', async event => {
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
        const audioElement = document.querySelector('audio')!
        audioElement.src = URL.createObjectURL(data)
        audioElement.play()
      }
    })
    ws.addEventListener('message', async event => {
      const m = event.data.match(/PING :tmi.twitch.tv/)
      if (m) {
        ws.send('PONG :tmi.twitch.tv')
      }
    })
    ws.addEventListener('close', event => {
      console.log('Socket is closed. Reconnect will be attempted in 1 second.', event)
      setTimeout(() => {
        listen()
      }, 1000)
    })
    ws.addEventListener('error', event => {
      console.error('Socket encountered error: ', event, 'Closing socket')
      ws.close()
    })
  }

  listen()
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
