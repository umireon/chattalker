import { Auth, User } from 'firebase/auth'
import { Firestore, collection, doc, setDoc } from 'firebase/firestore'

import { fetchAudio } from './audio'

export const playAudio = (blob: Blob) => {
  const element = document.querySelector('audio')
  if (element !== null) {
    element.src = URL.createObjectURL(blob)
    element.play()
  }
}

export const showLanguage = (language: string) => {
  const element = document.querySelector('#language')
  if (element !== null) {
    element.textContent = language
  }
}

export const showText = (text: string) => {
  const element = document.querySelector('#text')
  if (element !== null) {
    element.textContent = text
  }
}

export const listenLogout = (auth: Auth, element: HTMLElement) => {
  element.addEventListener('click', async () => {
    await auth.signOut()
    location.href = '/'
  })
}

export const listenPlay = (endpoing: string, user: User, element: HTMLButtonElement) => {
  element.addEventListener('click', async () => {
    element.disabled = true
    const { audioContent, language } = await fetchAudio(endpoing, user, element.value)
    element.disabled = false
    playAudio(new Blob([audioContent]))
    showLanguage(language)
    showText(element.value)
  })
}

export const listenVoiceChange = (db: Firestore, user: User, element: HTMLSelectElement) => {
  element.addEventListener('change', () =>
    setDoc(doc(collection(db, 'users'), user.uid), { [element.id]: element.value }, { merge: true })
  )
}
