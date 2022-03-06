import { getUserData, setUserData } from './users'

import type { AppContext } from '../../constants'
import type { Firestore } from 'firebase/firestore'
import type { User } from 'firebase/auth'
import type { UserData } from './users'

export const getOauthToken = async (db: Firestore, user: User, name: 'twitch' | 'youtube'): Promise<string | undefined> => {
  const data = await getUserData(db, user)
  if (data) {
    return data[`${name}-access-token`]
  }
}

export const setOauthToken = async (db: Firestore, user: User, name: 'twitch' | 'youtube') => {
  const params = new URLSearchParams(location.hash.slice(1))
  const token = params.get('access_token')
  if (token) {
    await setUserData(db, user, {
      [`${name}-access-token`]: token
    })
    return true
  } else {
    return false
  }
}

/* eslint-disable camelcase */
export interface YoutubeOauthResponse {
  readonly access_token: string
  readonly expires_in: number
  readonly refresh_token?: string
  readonly scope: string
  readonly token_type: 'Bearer'
}
/* eslint-enable camelcase */

const checkIfYoutubeOauthResponse = (arg: any): arg is YoutubeOauthResponse =>
  typeof arg === 'object' && 'token_type' in arg && arg.token_type === 'Bearer'

export interface ExchangeYoutubeTokenParams {
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
  let data: UserData = { 'youtube-access-token': params.access_token }
  if (typeof params.refresh_token !== 'undefined') {
    data = { ...data, 'youtube-refresh-token': params.refresh_token }
  }
  await setUserData(db, user, data)
}

export const getYoutubeToken = async (db: Firestore, user: User) => {
  const data = await getUserData(db, user)
  return data['youtube-access-token']
}

export const refreshYoutubeToken = async ({ youtubeRefreshEndpoint }: AppContext, db: Firestore, user: User) => {
  const data = await getUserData(db, user)
  const refreshToken = data['youtube-refresh-token']
  if (typeof refreshToken !== 'undefined') {
    const query = new URLSearchParams({ refreshToken })
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
