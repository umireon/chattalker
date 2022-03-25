<script lang="ts">
  import { getUserData, setUserData } from '../service/users'

  import type { Firestore } from 'firebase/firestore'
  import type { User } from 'firebase/auth'

  export let db: Firestore
  export let user: User

  let value: string = ''

  function uint8ArrayToHexString (array: Uint8Array) {
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
  }

  async function handleClickGenerateUrl () {
    const { token } = await getUserData(db, user)
    if (typeof token !== 'undefined' && token !== null) {
      const query = new URLSearchParams({ token: token, uid: user.uid })
      value = `${location.origin}${location.pathname}#${query}`
    } else {
      const buffer = new Uint8Array(256)
      const newTokenArray = crypto.getRandomValues(buffer)
      const newToken = uint8ArrayToHexString(newTokenArray)
      await setUserData(db, user, { token: newToken })
      const query = new URLSearchParams({ token: newToken, uid: user.uid })
      value = `${location.origin}${location.pathname}#${query}`
    }
  }

  async function handleClickCopyUrl () {
    await navigator.clipboard.writeText(value)
  }


  async function handleClickResetUrl () {
    await setUserData(db, user, { token: null })
    value = ''
  }
</script>

<main>
  <p>
    <button type="button" on:click={handleClickGenerateUrl}>Generate URL for OBS browser</button>
    <input placeholder="OBS URL" {value}>
    <button type="button" on:click={handleClickCopyUrl}>Copy URL</button>
    <button type="button" on:click={handleClickResetUrl}>Reset URL</button>
  </p>
</main>
