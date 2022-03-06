import type { Firestore, FirestoreDataConverter } from 'firebase/firestore'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'

import type { User } from 'firebase/auth'

export interface UserData {
  readonly 'twitch-access-token'?: string
  readonly 'voice-en'?: string
  readonly 'voice-ja'?: string
  readonly 'voice-und'?: string
  readonly 'youtube-access-token'?: string
  readonly 'youtube-refresh-token'?: string
}

export const userConverter: FirestoreDataConverter<UserData> = {
  fromFirestore: snapshot => {
    const data = snapshot.data()
    return {
      'twitch-access-token': data['twitch-access-token'],
      'voice-en': data['voice-en'],
      'voice-ja': data['voice-ja'],
      'voice-und': data['voice-und'],
      'youtube-access-token': data['youtube-access-token'],
      'youtube-refresh-token': data['youtube-refresh-token']
    }
  },
  toFirestore: data => ({
    'twitch-access-token': data['twitch-access-token'],
    'voice-en': data['voice-enn'],
    'voice-ja': data['voice-ja'],
    'voice-und': data['voice-un'],
    'youtube-access-token': data['youtube-access-token'],
    'youtube-refresh-token': data['youtube-refresh-token']
  })
}

export const getUsersCollection = (db: Firestore) => collection(db, 'users').withConverter(userConverter)

export const getUserData = async (db: Firestore, user: User) => {
  const docRef = await getDoc(doc(getUsersCollection(db), user.uid))
  return docRef.data()
}

export const setUserData = async (db: Firestore, user: User, data: UserData) => {
  await setDoc(doc(getUsersCollection(db), user.uid), data, { merge: true })
}
