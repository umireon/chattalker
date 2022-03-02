import { Analytics, logEvent } from 'firebase/analytics'
import { Auth, User } from 'firebase/auth'
import { Firestore, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

import { Message } from '../types'
import { decode } from '@msgpack/msgpack'

const ENDPOINT = 'https://text-to-speech-hypfl7atta-uc.a.run.app/'

export const getTwitchLogin = async (token: string) => {
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

export const fetchAudio = async (user: User, text: string) => {
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

export const playAudio = (blob: Blob) => {
  const element = document.querySelector('audio')
  if (element !== null) {
    element.src = URL.createObjectURL(blob)
    element.play()
  }
}

export const showLanguage = (language: string) => {
  const element = document.querySelector('#language')
  if (element !== null) {
    element.textContent = language
  }
}

export const showText = (text: string) => {
  const element = document.querySelector('#text')
  if (element !== null) {
    element.textContent = text
  }
}

export const connect = async (analytics: Analytics, user: User, twitchToken: string, twitchLogin: string) => {
  const socket = new WebSocket('wss://irc-ws.chat.twitch.tv')
  socket.addEventListener('open', () => {
    socket.send(`PASS oauth:${twitchToken}`)
    socket.send(`NICK ${twitchLogin}`)
    socket.send(`JOIN #${twitchLogin}`)
    socket.send('VERSION')
  })
  socket.addEventListener('message', async event => {
    console.log(event.data)
  })
  socket.addEventListener('message', async event => {
    const m = event.data.match(new RegExp(`PRIVMSG #${twitchLogin} :(.*)`))
    if (m) {
      const { audioContent, language } = await fetchAudio(user, m[1])
      playAudio(new Blob([audioContent]))
      showLanguage(language)
      showText(m[1])
      logEvent(analytics, 'chat_played')
    }
  })
  socket.addEventListener('message', async event => {
    const m = event.data.match(/PING :tmi.twitch.tv/)
    if (m) {
      socket.send('PONG :tmi.twitch.tv')
    }
  })
  socket.addEventListener('close', event => {
    console.log(event)
    setTimeout(() => {
      connect(analytics, user, twitchToken, twitchLogin)
    }, 1000)
  })
  socket.addEventListener('error', event => {
    console.error(event)
    socket.close()
  })
}

export const listenLogout = (auth: Auth, element: HTMLElement) => {
  element.addEventListener('click', async () => {
    await auth.signOut()
    location.href = '/'
  })
}

export const listenDisconnect = (db: Firestore, user: User, element: HTMLElement) => {
  element.addEventListener('click', async () => {
    await setDoc(doc(collection(db, 'users'), user.uid), {})
    location.href = '/twitch.html'
  })
}

export const listenPlay = (user: User, element: HTMLButtonElement) => {
  element.addEventListener('click', async () => {
    const { audioContent } = await fetchAudio(user, element.value)
    playAudio(new Blob([audioContent]))
  })
}

export const getUserData = async (db: Firestore, user: User) => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  return docRef.data()
}

export const listenVoiceChange = (db: Firestore, user: User, element: HTMLSelectElement) => {
  element.addEventListener('change', () =>
    updateDoc(doc(collection(db, 'users'), user.uid), { [element.id]: element.value })
  )
}

export const getTwitchToken = async (db: Firestore, user: User): Promise<string | undefined> => {
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
