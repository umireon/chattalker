import { AppContext, DEFAULT_CONTEXT, firebaseConfig } from '../constants'
import type { Auth, User } from 'firebase/auth'
import { connectTwitch, getTwitchLogin } from './service/twitch'
import { generateNonce, getTwitchToken, getYoutubeToken } from './service/oauth'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { getUserData, setUserData, validateVoiceKeys } from './service/users'
import { listenLogout, listenPlay, listenVoiceChange } from './service/ui'

import type { PlayerElements } from './service/ui'
import { connectYoutube } from './service/youtube'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { sendKeepAliveToTextToSpeech } from './service/audio'

import 'three-dots/dist/three-dots.min.css'

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const analytics = getAnalytics(app)

const logoutElement = document.querySelector('#logout')
if (logoutElement === null) throw new Error('Logout element not found')
listenLogout(auth, logoutElement)

interface AuthenticateWithTokenOptions {
  readonly token: string
  readonly uid: string
}

const authenticateWithToken = async (auth: Auth, { authenticateWithTokenEndpoint }: AppContext, { token, uid }: AuthenticateWithTokenOptions) => {
  const query = new URLSearchParams({ token, uid })
  const response = await fetch(`${authenticateWithTokenEndpoint}?${query}`)
  if (!response.ok) throw new Error('Authentication failed')
  const customToken = await response.text()
  console.log(customToken)
  const credential = await signInWithCustomToken(auth, customToken)
  console.log(credential)
  return credential
}

const initializePageWithUser = async (user: User | null) => {
  if (user) {
    const audioElement = document.querySelector('audio')
    const languageElement = document.querySelector('#language')
    const loadingElement = document.querySelector('#loading')
    const textElement = document.querySelector('#text')
    const voiceFormElement = document.querySelector('form')
    if (audioElement === null || languageElement === null ||
      loadingElement === null || textElement === null || voiceFormElement === null) throw new Error('Player elements not found')
    const playerElements: PlayerElements = { audioElement, languageElement, loadingElement, textElement, voiceFormElement }

    for (const element of document.querySelectorAll<HTMLButtonElement>('button.play')) {
      listenPlay(DEFAULT_CONTEXT, user, playerElements, element)
    }

    const data = await getUserData(db, user)
    for (const element of document.querySelectorAll('select')) {
      listenVoiceChange(db, user, element)
      if (typeof data !== 'undefined' && validateVoiceKeys(element.id)) {
        const value = data[element.id]
        if (typeof value === 'string') {
          element.value = value
        }
      }
    }

    const twitchToken = await getTwitchToken(db, user)
    if (typeof twitchToken !== 'undefined') {
      const twitchLogin = await getTwitchLogin(DEFAULT_CONTEXT, twitchToken)
      connectTwitch(DEFAULT_CONTEXT, analytics, user, playerElements, {
        login: twitchLogin,
        token: twitchToken
      })
    }

    const youtubeToken = await getYoutubeToken(db, user)
    if (typeof youtubeToken !== 'undefined') {
      connectYoutube(DEFAULT_CONTEXT, db, analytics, user, playerElements, { token: youtubeToken })
    }

    const twitchConnectElement = document.querySelector<HTMLButtonElement>('button#connect-twitch')
    if (twitchConnectElement === null) throw new Error('Connect Twitch element not found')
    twitchConnectElement.addEventListener('click', async () => {
      const nonce = generateNonce()
      await setUserData(db, user, { nonce })
      const query = new URLSearchParams({
        client_id: DEFAULT_CONTEXT.twitchClientId,
        redirect_uri: `${location.origin}${location.pathname}`.replace(/app.html$/, 'twitch.html'),
        response_type: 'token',
        scope: 'chat:read',
        state: nonce
      })
      location.href = `https://id.twitch.tv/oauth2/authorize?${query}`
    })

    const youtubeConnectElement = document.querySelector<HTMLButtonElement>('button#connect-youtube')
    if (youtubeConnectElement === null) throw new Error('Connect YouTube element not found')
    youtubeConnectElement.addEventListener('click', async () => {
      const nonce = generateNonce()
      await setUserData(db, user, { nonce })
      const query = new URLSearchParams({
        access_type: 'offline',
        client_id: DEFAULT_CONTEXT.youtubeClientId,
        redirect_uri: `${location.origin}${location.pathname}`.replace(/app.html$/, 'youtube.html'),
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/youtube.readonly',
        state: nonce
      })
      location.href = `https://accounts.google.com/o/oauth2/auth?${query}`
    })

    setInterval(() => {
      sendKeepAliveToTextToSpeech(DEFAULT_CONTEXT, user)
    }, 60000)
    sendKeepAliveToTextToSpeech(DEFAULT_CONTEXT, user)

    const uint8ArrayToHexString = (array: Uint8Array) => Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
    const generateUrlButtonElement = document.querySelector<HTMLButtonElement>('button#generate-url')
    const urlElement = document.querySelector<HTMLInputElement>('input#url')
    if (generateUrlButtonElement === null) throw new Error('Generate URL button not found')
    if (urlElement === null) throw new Error('URL input not found')
    generateUrlButtonElement.addEventListener('click', async () => {
      const { token } = await getUserData(db, user)
      if (token) {
        const query = new URLSearchParams({ token: token, uid: user.uid })
        urlElement.value = `${location.origin}${location.pathname}#${query}`
      } else {
        const buffer = new Uint8Array(256)
        const newTokenArray = crypto.getRandomValues(buffer)
        const newToken = uint8ArrayToHexString(newTokenArray)
        await setUserData(db, user, { token: newToken })
        const query = new URLSearchParams({ token: newToken, uid: user.uid })
        urlElement.value = `${location.origin}${location.pathname}#${query}`
      }
    })
  }
}

const initializePage = async (auth: Auth) => {
  const params = new URLSearchParams(location.hash.slice(1))
  const token = params.get('token')
  const uid = params.get('uid')
  if (token && uid) {
    authenticateWithToken(auth, DEFAULT_CONTEXT, { token, uid })
    auth.onAuthStateChanged(initializePageWithUser)
  } else {
    auth.onAuthStateChanged(initializePageWithUser)
  }
}

initializePage(auth)
