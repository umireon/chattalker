import { Analytics, logEvent } from 'firebase/analytics'
import { playAudio, showLanguage, showText } from './ui'

import { User } from 'firebase/auth'
import { fetchAudio } from './audio'

export const getTwitchLogin = async (clientId: string, token: string) => {
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Client-Id': clientId
    }
  })
  if (!response.ok) throw new Error('Twitch login couldnot be retrieved!')
  const { data: [{ login }] } = await response.json()
  return login
}

export const connectTwitch = async (analytics: Analytics, endpoint: string, user: User, twitchToken: string, twitchLogin: string) => {
  const socket = new WebSocket('wss://irc-ws.chat.twitch.tv')
  socket.addEventListener('open', () => {
    socket.send(`PASS oauth:${twitchToken}`)
    socket.send(`NICK ${twitchLogin}`)
    socket.send(`JOIN #${twitchLogin}`)
  })
  socket.addEventListener('message', async event => {
    console.log(event.data)
  })
  socket.addEventListener('message', async event => {
    const m = event.data.match(new RegExp(`PRIVMSG #${twitchLogin} :(.*)`))
    if (m) {
      const { audioContent, language } = await fetchAudio(endpoint, user, m[1])
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
      connectTwitch(analytics, endpoint, user, twitchToken, twitchLogin)
    }, 1000)
  })
  socket.addEventListener('error', event => {
    console.error(event)
    socket.close()
  })
}
