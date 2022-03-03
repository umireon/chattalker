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
