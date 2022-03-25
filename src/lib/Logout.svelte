<script lang="ts">
  import type { Auth } from 'firebase/auth'

  export let auth: Auth

  async function handleLogout () {
    await auth.signOut()
    location.href = '/'
  }
</script>

<main>
  <p>
    <button type="button" on:click={handleLogout}>Logout</button>
  </p>
</main>
