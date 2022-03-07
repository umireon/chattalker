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

export const extractUserData = (data: UserData) => {
  let result: UserData = {}
  if (data['twitch-access-token']) result = { ...result, 'twitch-access-token': data['twitch-access-token'] }
  if (data['voice-en']) result = { ...result, 'voice-en': data['voice-en'] }
  if (data['voice-ja']) result = { ...result, 'voice-ja': data['voice-ja'] }
  if (data['voice-und']) result = { ...result, 'voice-und': data['voice-und'] }
  if (data['youtube-access-token']) result = { ...result, 'youtube-access-token': data['youtube-access-token'] }
  if (data['youtube-refresh-token']) result = { ...result, 'youtube-refresh-token': data['youtube-refresh-token'] }
  return result
}

export const userConverter: FirestoreDataConverter<UserData> = {
  fromFirestore: snapshot => {
    const data = snapshot.data()
    return extractUserData(data)
  },
  toFirestore: extractUserData
}

export const getUsersCollection = (db: Firestore) => collection(db, 'users').withConverter(userConverter)

export const getUserData = async (db: Firestore, user: User) => {
  const docRef = await getDoc(doc(getUsersCollection(db), user.uid))
  return docRef.data()
}

export const setUserData = async (db: Firestore, user: User, data: UserData) => {
  await setDoc(doc(getUsersCollection(db), user.uid), data, { merge: true })
}
