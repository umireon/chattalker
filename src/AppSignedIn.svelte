<script lang="ts">
  import type { Auth, User } from 'firebase/auth'
  import Voice, { defaultVoiceEn, defaultVoiceJa, defaultVoiceUnd } from './lib/Voice.svelte'
  import { connectTwitch, getTwitchLogin } from './service/twitch'
  import { fetchAudio, sendKeepAliveToTextToSpeech } from './service/audio'
  import { getTwitchToken, getYoutubeToken } from './service/oauth'

  import type { Analytics } from 'firebase/analytics'
  import Connect from './lib/Connect.svelte'
  import { DEFAULT_CONTEXT } from '../constants'
  import type { Firestore } from 'firebase/firestore'
  import GenerateUrl from './lib/GenerateUrl.svelte'
  import Logout from './lib/Logout.svelte'
  import Player from './lib/Player.svelte'
  import Toastify from 'toastify-js'
  import type { UserData } from './service/users'
  import { connectYoutube } from './service/youtube'
  import { logEvent } from 'firebase/analytics'
  import { setUserData } from './service/users'

  import 'three-dots/dist/three-dots.min.css'
  import 'toastify-js/src/toastify.css'

  export let analytics: Analytics
  export let auth: Auth
  export let db: Firestore

  export let user: User
  export let initialUserData: UserData

  const context = DEFAULT_CONTEXT

  let voiceEn: string = initialUserData['voice-en'] || defaultVoiceEn
  let voiceJa: string = initialUserData['voice-ja'] || defaultVoiceJa
  let voiceUnd: string = initialUserData['voice-und'] || defaultVoiceUnd

  $: setUserData(db, user, {
    'voice-en': voiceEn,
    'voice-ja': voiceJa,
    'voice-und': voiceUnd
  })

  let playerIsLoading: boolean = false
  let playerLanguage: string = ''
  let playerSrc: string = './empty.mp3'
  let playerText: string = ''

  async function playAudio (text: string) {
    const voice = {
      'voice[en]': voiceEn,
      'voice[ja]': voiceJa,
      'voice[und]': voiceUnd
    }
    playerIsLoading = true
    const { audioContent, language } = await fetchAudio(DEFAULT_CONTEXT, user, voice, text)
    playerIsLoading = false
    playerLanguage = language
    playerSrc = URL.createObjectURL(audioContent)
    playerText = text
    logEvent(analytics, 'chat_played')
  }

  function initializeVoice () {
    if (typeof initialUserData['voice-en'] !== 'undefined') voiceEn = initialUserData['voice-en']
    if (typeof initialUserData['voice-ja'] !== 'undefined') voiceJa = initialUserData['voice-ja']
    if (typeof initialUserData['voice-und'] !== 'undefined') voiceUnd = initialUserData['voice-und']
  }

  async function initializeTwitch () {
    const token = await getTwitchToken(db, user)
    if (typeof token === 'undefined') return
    const login = await getTwitchLogin(DEFAULT_CONTEXT, token)
      .catch(e => {
        Toastify({ text: e.toString() }).showToast()
      })
    if (typeof login === 'undefined') return
    connectTwitch({ login, token }, playAudio)
  }

  async function initializeYoutube () {
    const token = await getYoutubeToken(db, user)
    if (typeof token === 'undefined') return
    connectYoutube(DEFAULT_CONTEXT, db, user, { token }, playAudio)
      .catch(e => {
        Toastify({ text: e.toString() }).showToast()
      })
  }

  initializeVoice()
  initializeTwitch()
  initializeYoutube()

  setInterval(() => {
    sendKeepAliveToTextToSpeech(DEFAULT_CONTEXT, user)
  }, 60000)
  sendKeepAliveToTextToSpeech(DEFAULT_CONTEXT, user)
</script>

<main>
  <Voice
    bind:voiceEn
    bind:voiceJa
    bind:voiceUnd
    {playAudio}
  />
  <Player
    bind:playerIsLoading
    bind:playerLanguage
    bind:playerSrc
    bind:playerText
  />
  <Connect {context} {db} {user} />
  <GenerateUrl {db} {user} />
  <Logout {auth} />
</main>