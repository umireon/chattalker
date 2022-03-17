import { Analytics, logEvent } from 'firebase/analytics'
import { hideLoadingElement, playAudio, readVoiceFromPlayer, showLanguage, showLoadingElement, showText } from './ui'

import type { AppContext } from '../../constants'
import type { PlayerElements } from './ui'
import type { User } from 'firebase/auth'
import { fetchAudio } from './audio'

interface TwitchUsersData {
  readonly login: string
}

interface TwitchUsersResponse {
  readonly data: TwitchUsersData[]
}

export const validateTwitchUsersResponse = (arg: any): arg is TwitchUsersResponse => {
  if (typeof arg === 'undefined' || arg === null) return false
  return Array.isArray(arg.data)
}

export const getTwitchLogin = async ({ twitchClientId }: AppContext, token: string): Promise<string> => {
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': twitchClientId
    }
  })
  if (!response.ok) throw new Error('Twitch login could not be retrieved!')
  const json: unknown = await response.json()
  if (!validateTwitchUsersResponse(json)) throw new Error('Invalid response')
  const { data: [{ login }] } = json
  return login
}

export interface ConnectTwitchParams {
  login: string
  token: string
}

export const connectTwitch = (context: AppContext, analytics: Analytics, user: User, playerElements: PlayerElements, params: ConnectTwitchParams) => {
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
      const voice = readVoiceFromPlayer(playerElements)
      showLoadingElement(playerElements)
      const { audioContent, language } = await fetchAudio(context, user, voice, m[1])
      hideLoadingElement(playerElements)
      playAudio(playerElements, audioContent)
      showLanguage(playerElements, language)
      showText(playerElements, m[1])
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
      connectTwitch(context, analytics, user, playerElements, params)
    }, 1000)
  })
  socket.addEventListener('error', event => {
    console.error(event)
    socket.close()
  })
}
