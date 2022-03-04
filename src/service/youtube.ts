import { collection, doc, setDoc } from 'firebase/firestore'

import type { Firestore } from 'firebase/firestore'
import type { User } from 'firebase/auth'

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
  const { access_token: accessToken, refresh_token: refreshToken } = params
  await setDoc(doc(collection(db, 'users'), user.uid), {
    'youtube-access-token': accessToken,
    'youtube-refresh-token': refreshToken
  }, { merge: true })
}

interface LiveBroadcastSnippet {
  liveChatId: string
}

interface LiveBroadcastStatus {
  lifeCycleStatus: string
}

interface LiveBroadcastResource {
  snippet: LiveBroadcastSnippet
  status: LiveBroadcastStatus
}

interface LiveBroadcastResponse {
  items: LiveBroadcastResource[]
}

export const getActiveLiveChatIds = async (token: string) => {
  const query = new URLSearchParams({
    broadcastType: 'all',
    maxResults: '10',
    mine: 'true',
    part: 'snippet,contentDetails,status'
  })
  const response = await fetch(`https://www.googleapis.com/youtube/v3/liveBroadcasts?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const json: LiveBroadcastResponse = await response.json()
  const liveItems = json.items.filter(e => ['ready'].includes(e.status.lifeCycleStatus))
  return liveItems.map(({ snippet: { liveChatId } }) => liveChatId)
}

interface LiveChatMessageResponse {
  nextPageToken: string
  pollingIntervalMillis: number
  items: any
}

export const getLiveChatMessages = async (token: string, liveChatId: string, pageToken: string = undefined) => {
  const query = new URLSearchParams({
    liveChatId,
    part: 'id,snippet,authorDetails'
  })
  if (pageToken) {
    query.set('pageToken', pageToken)
  }
  const response = await fetch(`https://www.googleapis.com/youtube/v3/liveChat/messages?${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  if (!response.ok) throw new Error('Error')
  const json: LiveChatMessageResponse = await response.json()
  const { items, nextPageToken, pollingIntervalMillis } = json
  return { items, liveChatId, nextPageToken, pollingIntervalMillis }
}

export async function * pollLiveChatMessages (token: string) {
  let pageTokens: Record<string, string> = {}
  while (true) {
    const liveChatIds = await getActiveLiveChatIds(token)
    const result = await Promise.all(liveChatIds.map(liveChatId => getLiveChatMessages(liveChatId, pageTokens[liveChatId])))
    const interval = Math.max(...result.map(e => e.pollingIntervalMillis))
    pageTokens = Object.fromEntries(result.map(e => [e.liveChatId, e.nextPageToken]))
    yield result.map(e => e.items)
    await new Promise(resolve => { setTimeout(resolve, interval) })
  }
}
