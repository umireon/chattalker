import { fetchAudio, readVoiceFromForm } from './audio'
import { playAudio, showLanguage, showText } from './ui'
import { refreshYoutubeToken, setYoutubeToken } from './oauth'

import type { Analytics } from 'firebase/analytics'
import type { AppContext } from '../../constants'
import type { Firestore } from 'firebase/firestore'
import type { PlayerElements } from './ui'
import type { User } from 'firebase/auth'
import { logEvent } from 'firebase/analytics'

export class YoutubeRequestError extends Error {}

export interface LiveBroadcastSnippet {
  readonly liveChatId: string
}

export interface LiveBroadcastStatus {
  readonly lifeCycleStatus: string
}

export interface LiveBroadcastResource {
  readonly snippet: LiveBroadcastSnippet
  readonly status: LiveBroadcastStatus
}

export interface LiveBroadcastResponse {
  readonly items: LiveBroadcastResource[]
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
  if (!response.ok) throw new YoutubeRequestError('Request failed')
  const json: LiveBroadcastResponse = await response.json()
  console.log(json)
  const liveItems = json.items.filter(e => ['live', 'ready'].includes(e.status.lifeCycleStatus))
  return liveItems.map(({ snippet: { liveChatId } }) => liveChatId)
}

export interface LiveChatMessageSnippet {
  readonly displayMessage?: string
  readonly publishedAt: string
}

export interface LiveChatMessageResource {
  readonly snippet: LiveChatMessageSnippet
}

export interface LiveChatMessageResponse {
  readonly nextPageToken: string
  readonly pollingIntervalMillis: number
  readonly items: LiveChatMessageResource[]
}

export const getLiveChatMessages = async (token: string, liveChatId: string, pageToken: string) => {
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
  if (!response.ok) throw new YoutubeRequestError('Request failed')
  const json: LiveChatMessageResponse = await response.json()
  console.log(json)
  return json
}

export async function * pollLiveChatMessages (token: string) {
  let pageTokens: Record<string, string> = {}
  while (true) {
    const liveChatIds = await getActiveLiveChatIds(token)
    const result = await Promise.all(liveChatIds.map(liveChatId => getLiveChatMessages(token, liveChatId, pageTokens[liveChatId])))
    const interval = Math.max(...result.map(e => e.pollingIntervalMillis))
    pageTokens = Object.fromEntries(result.map((e, i) => [liveChatIds[i], e.nextPageToken]))
    yield result.flatMap(e => e.items)
    await new Promise(resolve => { setTimeout(resolve, interval) })
  }
}

interface ConnectYoutubeParams {
  token: string
}

export const connectYoutube = async (context: AppContext, db: Firestore, analytics: Analytics, user: User, playerElements: PlayerElements, params: ConnectYoutubeParams) => {
  const { loadingElement } = playerElements
  const { token } = params
  try {
    for await (const items of pollLiveChatMessages(token)) {
      for (const item of items) {
        const displayMessage = item.snippet.displayMessage
        const chatTime = new Date(item.snippet.publishedAt).getTime()
        const freshTime = new Date().getTime() - 10 * 1000
        if (chatTime > freshTime && typeof displayMessage !== 'undefined') {
          const form = document.querySelector('form')
          const voice = form === null ? {} : readVoiceFromForm(form)
          loadingElement.classList.remove('hidden')
          const { audioContent, language } = await fetchAudio(context, user, voice, displayMessage)
          loadingElement.classList.add('hidden')
          playAudio(playerElements, new Blob([audioContent]))
          showLanguage(playerElements, language)
          showText(playerElements, displayMessage)
          logEvent(analytics, 'chat_played')
        }
      }
    }
  } catch (e) {
    if (e instanceof YoutubeRequestError) {
      const oauthResponse = await refreshYoutubeToken(context, db, user)
      await setYoutubeToken(user, db, oauthResponse)
      connectYoutube(context, db, analytics, user, playerElements, { ...params, token: oauthResponse.access_token })
    }
  }
}
