<script lang="ts">
  import type { Auth, User } from 'firebase/auth'
  import { DEFAULT_CONTEXT, firebaseConfig } from '../constants'

  import AppSignedIn from './AppSignedIn.svelte'
  import Logout from './lib/Logout.svelte'
  import { authenticateWithToken } from './service/auth'
  import { getAnalytics } from 'firebase/analytics'
  import { getAuth } from 'firebase/auth'
  import { getFirestore } from 'firebase/firestore'
  import { getUserData } from './service/users'
  import { initializeApp } from 'firebase/app'

  import 'three-dots/dist/three-dots.min.css'

  const initializeUser = async (auth: Auth) => {
    const params = new URLSearchParams(location.hash.slice(1))
    const token = params.get('token')
    const uid = params.get('uid')
    if (token && uid) {
      const credential = await authenticateWithToken(auth, DEFAULT_CONTEXT, { token, uid })
      return credential.user
    } else {
      const user = await new Promise<User>((resolve, reject) => auth.onAuthStateChanged(async currentUser => {
        if (currentUser !== null) {
          resolve(currentUser)
        } else {
          reject(new Error('Not signed in'))
        }
      }))
      return user
    }
  }

  const app = initializeApp(firebaseConfig)
  const analytics = getAnalytics(app)
  const auth = getAuth(app)
  const db = getFirestore(app)
  const promise = initializeUser(auth).then(async user => {
    const initialUserData = await getUserData(db, user)
    return { initialUserData, user }
  })
</script>

<main>
  {#await promise}
    <div id="app-loading" class="dot-bricks" style="margin: 10px;"></div>
  {:then { initialUserData, user } }
    <AppSignedIn {analytics} {auth} {db} {initialUserData} {user} />
  {:catch}
    <Logout {auth} />
  {/await}
</main>
