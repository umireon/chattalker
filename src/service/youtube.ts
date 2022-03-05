import { playAudio, showLanguage, showText } from './ui'

import type { Analytics } from 'firebase/analytics'
import type { User } from 'firebase/auth'

import { fetchAudio } from './audio'
import { logEvent } from 'firebase/analytics'

interface LiveBroadcastSnippet {
  readonly liveChatId: string
}

interface LiveBroadcastStatus {
  readonly lifeCycleStatus: string
}

interface LiveBroadcastResource {
  readonly snippet: LiveBroadcastSnippet
  readonly status: LiveBroadcastStatus
}

interface LiveBroadcastResponse {
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
  const json: LiveBroadcastResponse = await response.json()
  const liveItems = json.items.filter(e => ['ready'].includes(e.status.lifeCycleStatus))
  return liveItems.map(({ snippet: { liveChatId } }) => liveChatId)
}

interface LiveChatMessageSnippet {
  readonly displayMessage?: string
  readonly publishedAt: string
}

interface LiveChatMessageResource {
  readonly snippet: LiveChatMessageSnippet
}

interface LiveChatMessageResponse {
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
  if (!response.ok) throw new Error('Error')
  const json: LiveChatMessageResponse = await response.json()
  const { items, nextPageToken, pollingIntervalMillis } = json
  return { items, liveChatId, nextPageToken, pollingIntervalMillis }
}

export async function * pollLiveChatMessages (token: string) {
  let pageTokens: Record<string, string> = {}
  while (true) {
    const liveChatIds = await getActiveLiveChatIds(token)
    const result = await Promise.all(liveChatIds.map(liveChatId => getLiveChatMessages(token, liveChatId, pageTokens[liveChatId])))
    const interval = Math.max(...result.map(e => e.pollingIntervalMillis))
    pageTokens = Object.fromEntries(result.map(e => [e.liveChatId, e.nextPageToken]))
    yield result.flatMap(e => e.items)
    await new Promise(resolve => { setTimeout(resolve, interval) })
  }
}

export const connectYoutube = async (analytics: Analytics, user: User, { endpoint, token }: { readonly endpoint: string, readonly token: string }) => {
  for await (const items of pollLiveChatMessages(token)) {
    for (const item of items) {
      const displayMessage = item.snippet.displayMessage
      const chatTime = new Date(item.snippet.publishedAt).getTime()
      const freshTime = new Date().getTime() - 10 * 1000
      if (chatTime > freshTime && typeof displayMessage !== 'undefined') {
        const { audioContent, language } = await fetchAudio(endpoint, user, displayMessage)
        playAudio(new Blob([audioContent]))
        showLanguage(language)
        showText(displayMessage)
        logEvent(analytics, 'chat_played')
      }
    }
  }
}
