<script lang="ts">
  import type { AppContext } from '../../constants'
  import type { Firestore } from 'firebase/firestore'
  import type { User } from 'firebase/auth'
  import { generateNonce } from '../service/oauth'
  import { setUserData } from '../service/users'

  export let context: AppContext
  export let db: Firestore
  export let user: User

  async function handleTwitchConnect () {
    const nonce = generateNonce()
    await setUserData(db, user, { nonce })
    const query = new URLSearchParams({
      client_id: context.twitchClientId,
      redirect_uri: `${location.origin}${location.pathname}`.replace(/app.html$/, 'twitch.html'),
      response_type: 'token',
      scope: 'chat:read',
      state: nonce
    })
    location.href = `https://id.twitch.tv/oauth2/authorize?${query}`
  }

  async function handleYoutubeConnect () {
    const nonce = generateNonce()
    await setUserData(db, user, { nonce })
    const query = new URLSearchParams({
      access_type: 'offline',
      client_id: context.youtubeClientId,
      redirect_uri: `${location.origin}${location.pathname}`.replace(/app.html$/, 'youtube.html'),
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      state: nonce
    })
    location.href = `https://accounts.google.com/o/oauth2/auth?${query}`
  }
</script>

<main>
  <p>
    <button type="button" on:click={handleTwitchConnect}>Connect to Twitch</button>
    <button type="button" on:click={handleYoutubeConnect}>Connect to YouTube</button>
  </p>
</main>
