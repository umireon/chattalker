import { User, getAuth } from 'firebase/auth'
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore'

import { Message } from '../types'
import { decode } from '@msgpack/msgpack'
import { firebaseConfig } from './firebaseConfig'
import { initializeApp } from 'firebase/app'

const ENDPOINT = 'https://text-to-speech-hypfl7atta-uc.a.run.app/'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const connect = async (user: User, twitchToken: string) => {
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
        const response = await fetch(`${ENDPOINT}?${query}`, {
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        })
        if (!response.ok) throw new Error('Invalid message')
        const arrayBuffer = await response.arrayBuffer()
        const { text, audioContent, language } = decode(arrayBuffer) as Message

        const audioElement = document.querySelector('audio')
        if (audioElement !== null) {
          audioElement.src = URL.createObjectURL(new Blob([audioContent]))
          audioElement.play()
        }

        const languageElement = document.querySelector('#language')
        if (languageElement !== null) {
          languageElement.textContent = language
        }

        const textElement = document.querySelector('#text')
        if (textElement !== null) {
          textElement.textContent = text
        }
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
    const logoutElement = document.querySelector('#logout')
    if (logoutElement !== null) {
      logoutElement.addEventListener('click', async (e) => {
        await auth.signOut()
        location.href = '/'
      })
    }

    const disconnectElement = document.querySelector('#disconnect')
    if (disconnectElement !== null) {
      disconnectElement.addEventListener('click', async (e) => {
        await setDoc(doc(collection(db, 'users'), user.uid), {})
        location.href = '/twitch.html'
      })
    }

    const params = new URLSearchParams(location.hash.replace(/^#/, ''))
    const twitchToken = params.get('access_token')
    if (twitchToken) {
      await setDoc(doc(collection(db, 'users'), user.uid), { twitch_access_token: twitchToken })
      connect(user, twitchToken)
    } else {
      const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
      connect(user, docRef.data()!.twitch_access_token)
    }
  }
})
