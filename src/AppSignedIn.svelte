<script lang="ts">
  import { DEFAULT_CONTEXT } from '../constants'
  import type { Auth, User } from 'firebase/auth'
  import { connectTwitch, getTwitchLogin } from './service/twitch'
  import { generateNonce, getTwitchToken, getYoutubeToken } from './service/oauth'
  import { setUserData, UserData } from './service/users'

  import type { Analytics } from 'firebase/analytics'
  import type { Firestore } from 'firebase/firestore'
  import Toastify from 'toastify-js'
  import Voice, { defaultVoiceEn, defaultVoiceJa, defaultVoiceUnd } from './lib/Voice.svelte'
  import Player from './lib/Player.svelte'
  import { connectYoutube } from './service/youtube'
  import { fetchAudio } from './service/audio'
  import { logEvent } from 'firebase/analytics'

  import 'three-dots/dist/three-dots.min.css'
  import 'toastify-js/src/toastify.css'

  export let analytics: Analytics
  export let auth: Auth
  export let db: Firestore

  export let user: User
  export let userData: UserData

  let voiceEn: string = userData['voice-en'] || defaultVoiceEn
  let voiceJa: string = userData['voice-ja'] || defaultVoiceJa
  let voiceUnd: string = userData['voice-und'] || defaultVoiceUnd

  $: setUserData(db, user, {
    'voice-en': voiceEn,
    'voice-ja': voiceJa,
    'voice-und': voiceUnd
  })

  let playerIsLoading: boolean = false
  let playerLanguage: string = ''
  let playerSrc: string = './empty.mp3'
  let playerText: string = ''

  async function playAudio(text: string) {
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

  function initializeVoice() {
    if (typeof userData['voice-en'] !== 'undefined') voiceEn = userData['voice-en']
    if (typeof userData['voice-ja'] !== 'undefined') voiceJa = userData['voice-ja']
    if (typeof userData['voice-und'] !== 'undefined') voiceUnd = userData['voice-und']
  }

  async function initializeTwitch() {
    const token = await getTwitchToken(db, user)
    if (typeof token === 'undefined') return 
    const login = await getTwitchLogin(DEFAULT_CONTEXT, token)
      .catch(e => {
        Toastify({ text: e.toString() }).showToast()
      })
    if (typeof login === 'undefined') return
    connectTwitch(DEFAULT_CONTEXT, analytics, user, { login, token }, playAudio)
  }

  async function initializeYoutube() {
    const token = await getYoutubeToken(db, user)
    if (typeof token === 'undefined') return
    connectYoutube(DEFAULT_CONTEXT, db, analytics, user, { token }, playAudio)
      .catch(e => {
        Toastify({ text: e.toString() }).showToast()
      })
  }

  initializeVoice()
  initializeTwitch()
  initializeYoutube()
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
  <p><button type="button" on:click={async () => {await auth.signOut(); location.href = '/'}}>Logout</button></p>
</main>