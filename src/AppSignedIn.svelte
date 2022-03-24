<script lang="ts">
  import { AppContext, DEFAULT_CONTEXT, firebaseConfig } from '../constants'
  import type { Auth, User } from 'firebase/auth'
  import { connectTwitch, getTwitchLogin } from './service/twitch'
  import { generateNonce, getTwitchToken, getYoutubeToken } from './service/oauth'
  import { getAuth, signInWithCustomToken } from 'firebase/auth'
  import { getUserData, setUserData, UserData, validateVoiceKeys } from './service/users'
  import { listenLogout, listenPlay, listenVoiceChange } from './service/ui'

  import type { Analytics } from 'firebase/analytics'
  import App from './AppSignedIn.svelte'
  import type { Firestore } from 'firebase/firestore'
  import type { PlayerElements } from './service/ui'
  import Toastify from 'toastify-js'
  import Voice, { defaultVoiceEn, defaultVoiceJa, defaultVoiceUnd } from './lib/Voice.svelte'
  import { connectYoutube } from './service/youtube'
  import { getAnalytics } from 'firebase/analytics'
  import { getFirestore } from 'firebase/firestore'
  import { initializeApp } from 'firebase/app'
  import { sendKeepAliveToTextToSpeech } from './service/audio'

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

  const initialize = async () => {
    const data = await getUserData(db, user)
    if (data['voice-en']) voiceEn = data['voice-en']
    if (data['voice-ja']) voiceJa = data['voice-ja']
    if (data['voice-und']) voiceUnd = data['voice-und']
  }

  initialize()
</script>

<main>
  <Voice
    bind:voiceEn={voiceEn}
    bind:voiceJa={voiceJa}
    bind:voiceUnd={voiceUnd}
  />
  <p><button type="button" on:click={async () => {await auth.signOut(); location.href = '/'}}>Logout</button></p>
</main>