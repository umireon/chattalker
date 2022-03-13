import type { Firestore, FirestoreDataConverter } from 'firebase/firestore'
import { collection, doc, getDoc, setDoc } from 'firebase/firestore'

import type { User } from 'firebase/auth'

export const VOICE_KEYS = ['voice-en', 'voice-ja', 'voice-und'] as const
export type VoiceKeys = typeof VOICE_KEYS[number]
export const validateVoiceKeys = (arg: string): arg is VoiceKeys => VOICE_KEYS.some(e => e === arg)

export interface UserData {
  readonly 'nonce'?: string
  readonly 'twitch-access-token'?: string
  readonly 'youtube-access-token'?: string
  readonly 'youtube-refresh-token'?: string
  readonly 'token-hash'?: string

  readonly 'voice-en'?: string
  readonly 'voice-ja'?: string
  readonly 'voice-und'?: string
}

export const extractUserData = (data: UserData) => {
  let result: UserData = {}
  if (data.nonce) result = { ...result, nonce: data.nonce }
  if (data['twitch-access-token']) result = { ...result, 'twitch-access-token': data['twitch-access-token'] }
  if (data['youtube-access-token']) result = { ...result, 'youtube-access-token': data['youtube-access-token'] }
  if (data['youtube-refresh-token']) result = { ...result, 'youtube-refresh-token': data['youtube-refresh-token'] }
  if (data['token-hash']) result = { ...result, 'token-hash': data['token-hash'] }

  for (const key of VOICE_KEYS) {
    if (data[key]) result = { ...result, [key]: data[key] }
  }
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
  return docRef.data() || {}
}

export const setUserData = async (db: Firestore, user: User, data: UserData) => {
  await setDoc(doc(getUsersCollection(db), user.uid), data, { merge: true })
}
