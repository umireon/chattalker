<script lang="ts">
  import { AppContext, DEFAULT_CONTEXT, firebaseConfig } from '../constants'
  import type { Auth, User } from 'firebase/auth'
  import { getAuth, signInWithCustomToken } from 'firebase/auth'

  import AppSignedIn from './AppSignedIn.svelte'
  import { getAnalytics } from 'firebase/analytics'
  import { getFirestore } from 'firebase/firestore'
  import { getUserData } from './service/users'
  import { initializeApp } from 'firebase/app'

  import 'three-dots/dist/three-dots.min.css'

  interface AuthenticateWithTokenOptions {
    readonly token: string
    readonly uid: string
  }

  const authenticateWithToken = async (auth: Auth, { authenticateWithTokenEndpoint }: AppContext, { token, uid }: AuthenticateWithTokenOptions) => {
    const query = new URLSearchParams({ token, uid })
    const response = await fetch(`${authenticateWithTokenEndpoint}?${query}`)
    if (!response.ok) throw new Error('Authentication failed')
    const customToken = await response.text()
    const credential = await signInWithCustomToken(auth, customToken)
    return credential
  }

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
    const userData = await getUserData(db, user)
    return { user, userData }
  })
</script>

<main>
  {#await promise}
    <div id="app-loading" class="dot-bricks" style="margin: 10px;"></div>
  {:then { user, userData } }
    <AppSignedIn {analytics} {auth} {db} {user} {userData} />
  {:catch}
    <p>Error occurred during signing in!</p>
  {/await}
</main>
