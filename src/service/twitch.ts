import { Analytics, logEvent } from 'firebase/analytics'
import { playAudio, showLanguage, showText } from './ui'

import type { AppContext } from '../../constants'
import type { User } from 'firebase/auth'
import { fetchAudio } from './audio'

export const getTwitchLogin = async ({ twitchClientId }: AppContext, token: string) => {
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': twitchClientId
    }
  })
  if (!response.ok) throw new Error('Twitch login couldnot be retrieved!')
  const { data: [{ login }] } = await response.json()
  return login
}

export interface ConnectTwitchParams {
  login: string
  token: string
}

export const connectTwitch = (context: AppContext, analytics: Analytics, user: User, params: ConnectTwitchParams) => {
  const { login, token } = params
  const socket = new WebSocket('wss://irc-ws.chat.twitch.tv')
  socket.addEventListener('open', () => {
    socket.send(`PASS oauth:${token}`)
    socket.send(`NICK ${login}`)
    socket.send(`JOIN #${login}`)
  })
  socket.addEventListener('message', async event => {
    console.log(event.data)
  })
  const privmsgRegexp = new RegExp(`PRIVMSG #${login} :(.*)`)
  socket.addEventListener('message', async event => {
    const m = event.data.match(privmsgRegexp)
    if (m) {
      const { audioContent, language } = await fetchAudio(context, user, m[1])
      playAudio(new Blob([audioContent]))
      showLanguage(language)
      showText(m[1])
      logEvent(analytics, 'chat_played')
    }
  })
  socket.addEventListener('message', async event => {
    const m = event.data.match(/PING :tmi.twitch.tv/)
    if (m) {
      socket.send('PONG :tmi.twitch.tv')
    }
  })
  socket.addEventListener('close', event => {
    console.log(event)
    setTimeout(() => {
      connectTwitch(context, analytics, user, params)
    }, 1000)
  })
  socket.addEventListener('error', event => {
    console.error(event)
    socket.close()
  })
}
