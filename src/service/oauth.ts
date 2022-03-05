import { collection, doc, getDoc, setDoc } from 'firebase/firestore'

import type { Firestore } from 'firebase/firestore'
import type { User } from 'firebase/auth'

export const getOauthToken = async (db: Firestore, user: User, name: 'twitch' | 'youtube'): Promise<string | undefined> => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  const data = docRef.data()
  if (data) {
    return data[`${name}-access-token`]
  }
}

export const setOauthToken = async (db: Firestore, user: User, name: 'twitch' | 'youtube') => {
  const params = new URLSearchParams(location.hash.slice(1))
  const token = params.get('access_token')
  if (token) {
    await setDoc(doc(collection(db, 'users'), user.uid), {
      [`${name}-access-token`]: token
    }, { merge: true })
    return true
  } else {
    return false
  }
}

/* eslint-disable camelcase */
interface YoutubeOauthResponse {
  readonly access_token: string
  readonly expires_in: number
  readonly refresh_token: string
  readonly token_type: 'Bearer'
}
/* eslint-enable camelcase */

const checkIfYoutubeOauthResponse = (arg: any): arg is YoutubeOauthResponse =>
  typeof arg === 'object' && 'token_type' in arg && arg.token_type === 'Bearer'

export const exchangeYoutubeToken = async (user: User, params: { readonly code: string, readonly redirectUri: string}) => {
  const query = new URLSearchParams(params)
  const idToken = await user.getIdToken()
  const response = await fetch(`https://oauth2callback-bf7bhumxka-uc.a.run.app?${query}`, {
    headers: {
      Authorization: `Bearer ${idToken}`
    }
  })
  if (!response.ok) throw new Error('Invalid response')
  const json = await response.json()
  if (!checkIfYoutubeOauthResponse(json)) throw new Error('Invalid response')
  return json
}

export const setYoutubeToken = async (user: User, db: Firestore, params: YoutubeOauthResponse) => {
  console.log(params)
  const { access_token: accessToken, refresh_token: refreshToken } = params
  await setDoc(doc(collection(db, 'users'), user.uid), {
    'youtube-access-token': accessToken,
    'youtube-refresh-token': refreshToken
  }, { merge: true })
}
