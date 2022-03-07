import type { Auth, User } from 'firebase/auth'
import { collection, doc, setDoc } from 'firebase/firestore'

import type { AppContext } from '../../constants'
import type { Firestore } from 'firebase/firestore'
import { fetchAudio } from './audio'

interface PlayerElements {
  readonly audioElement: HTMLAudioElement
  readonly languageElement: HTMLElement
  readonly textElement: HTMLElement
}

export const playAudio = ({ audioElement }: PlayerElements, blob: Blob) => {
  audioElement.src = URL.createObjectURL(blob)
  audioElement.play()
}

export const showLanguage = ({ languageElement }: PlayerElements, language: string) => {
  languageElement.textContent = language
}

export const showText = ({ textElement }: PlayerElements, text: string) => {
  textElement.textContent = text
}

export const listenLogout = (auth: Auth, element: HTMLElement) => {
  element.addEventListener('click', async () => {
    await auth.signOut()
    location.href = '/'
  })
}

export const listenPlay = (context: AppContext, user: User, playerElements: PlayerElements, element: HTMLButtonElement) => {
  element.addEventListener('click', async () => {
    element.disabled = true
    const { audioContent, language } = await fetchAudio(context, user, element.value)
    element.disabled = false
    playAudio(playerElements, audioContent)
    showLanguage(playerElements, language)
    showText(playerElements, element.value)
  })
}

export const listenVoiceChange = (db: Firestore, user: User, element: HTMLSelectElement) => {
  element.addEventListener('change', () =>
    setDoc(doc(collection(db, 'users'), user.uid), { [element.id]: element.value }, { merge: true })
  )
}
