import { Auth, User, getAuth } from 'firebase/auth'
import { collection, doc, getDoc, getFirestore, setDoc, updateDoc } from 'firebase/firestore'
import { getAnalytics, logEvent } from 'firebase/analytics'

import { Message } from '../types'
import { decode } from '@msgpack/msgpack'
import { firebaseConfig } from './firebaseConfig'
import { initializeApp } from 'firebase/app'

const ENDPOINT = 'https://text-to-speech-hypfl7atta-uc.a.run.app/'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

const getTwitchLogin = async (token: string) => {
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': '386m0kveloa87fbla7yivaw38unkft'
    }
  })
  if (!response.ok) throw new Error('Twitch login couldnot be retrieved!')
  const json = await response.json()
  const { data: [{ login }] } = json
  return login
}

const fetchAudio = async (user: User, text: string) => {
  const idToken = await user.getIdToken(true)
  const query = new URLSearchParams({ text })
  const form = document.querySelector('form')
  if (form !== null) {
    for (const [key, value] of new FormData(form)) {
      if (typeof value === 'string') {
        query.append(key, value)
      }
    }
  }
  const response = await fetch(`${ENDPOINT}?${query}`, {
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  })
  if (!response.ok) throw new Error('Invalid message')
  const arrayBuffer = await response.arrayBuffer()
  return decode(arrayBuffer) as Message
}

const playAudio = (blob: Blob) => {
  const element = document.querySelector('audio')
  if (element !== null) {
    element.src = URL.createObjectURL(blob)
    element.play()
  }
}

const showLanguage = (language: string) => {
  const element = document.querySelector('#language')
  if (element !== null) {
    element.textContent = language
  }
}

const showText = (text: string) => {
  const element = document.querySelector('#text')
  if (element !== null) {
    element.textContent = text
  }
}

const connect = async (user: User, twitchToken: string) => {
  const login = await getTwitchLogin(twitchToken)
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
        const { audioContent, language } = await fetchAudio(user, m[1])
        playAudio(new Blob([audioContent]))
        showLanguage(language)
        showText(m[1])
        logEvent(analytics, 'chat_played')
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

const listenLogout = (auth: Auth, element: HTMLElement) => {
  element.addEventListener('click', async () => {
    await auth.signOut()
    location.href = '/'
  })
}

const listenDisconnect = (user: User, element: HTMLElement) => {
  element.addEventListener('click', async () => {
    await setDoc(doc(collection(db, 'users'), user.uid), {})
    location.href = '/twitch.html'
  })
}

const listenPlay = (user: User, element: HTMLButtonElement) => {
  element.addEventListener('click', async () => {
    const { audioContent } = await fetchAudio(user, element.value)
    playAudio(new Blob([audioContent]))
  })
}

const getUserData = async (user: User) => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  return docRef.data()
}

const listenVoiceChange = (user: User, element: HTMLSelectElement) => {
  element.addEventListener('change', () =>
    updateDoc(doc(collection(db, 'users'), user.uid), { [element.id]: element.value })
  )
}

const getTwitchToken = async (user: User): Promise<string | undefined> => {
  const params = new URLSearchParams(location.hash.slice(1))
  const twitchToken = params.get('access_token')
  if (twitchToken) {
    await updateDoc(doc(collection(db, 'users'), user.uid), { twitch_access_token: twitchToken })
    return twitchToken
  } else {
    const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
    const data = docRef.data()
    return data?.twitch_access_token
  }
}

listenLogout(auth, document.querySelector('#logout'))

auth.onAuthStateChanged(async (user) => {
  if (user) {
    listenDisconnect(user, document.querySelector('#disconnect'))

    for (const element of document.querySelectorAll<HTMLButtonElement>('button.play')) {
      listenPlay(user, element)
    }

    const data = await getUserData(user)
    for (const element of document.querySelectorAll('select')) {
      listenVoiceChange(user, element)
      if (typeof data !== 'undefined' && typeof data[element.id] === 'string') {
        element.value = data[element.id]
      }
    }

    const twitchToken = await getTwitchToken(user)
    if (typeof twitchToken === 'undefined') {
      location.href = '/twitch.html'
    } else {
      connect(user, twitchToken)
    }
  }
})
