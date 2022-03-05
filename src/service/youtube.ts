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
    yield result.map(e => e.items)
    await new Promise(resolve => { setTimeout(resolve, interval) })
  }
}
