import { collection, doc, getDoc, setDoc } from 'firebase/firestore'

import type { AppContext } from '../../constants'
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
  readonly refresh_token?: string
  readonly scope: string
  readonly token_type: 'Bearer'
}
/* eslint-enable camelcase */

const checkIfYoutubeOauthResponse = (arg: any): arg is YoutubeOauthResponse =>
  typeof arg === 'object' && 'token_type' in arg && arg.token_type === 'Bearer'

interface ExchangeYoutubeTokenParams {
  readonly code: string
  readonly redirectUri: string
}

export const exchangeYoutubeToken = async ({ youtubeCallbackEndpoint }: AppContext, user: User, { code, redirectUri }: ExchangeYoutubeTokenParams) => {
  const query = new URLSearchParams({ code, redirectUri })
  const idToken = await user.getIdToken()
  const response = await fetch(`${youtubeCallbackEndpoint}?${query}`, {
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
  let data: { readonly 'youtube-access-token': string, readonly 'youtube-refresh-token'?: string } = { 'youtube-access-token': params.access_token }
  if (typeof params.refresh_token !== 'undefined') {
    data = { ...data, 'youtube-refresh-token': params.refresh_token }
  }
  await setDoc(doc(collection(db, 'users'), user.uid), data, { merge: true })
}

export const getYoutubeToken = async (db: Firestore, user: User) => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  const data = docRef.data()
  if (data) {
    return data['youtube-access-token']
  }
}

export const refreshYoutubeToken = async ({ youtubeRefreshEndpoint }: AppContext, db: Firestore, user: User) => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  const data = docRef.data()
  if (data && data['youtube-refresh-token']) {
    const query = new URLSearchParams({ refreshToken: data['youtube-refresh-token'] })
    const idToken = await user.getIdToken()
    const response = await fetch(`${youtubeRefreshEndpoint}?${query}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    })
    if (!response.ok) throw new Error('Invalid response')
    const json = await response.json()
    if (!checkIfYoutubeOauthResponse(json)) throw new Error('Invalid response')
    return json
  }
}
