import { Firestore, collection, doc, getDoc, setDoc } from 'firebase/firestore'

import { User } from 'firebase/auth'

export const getOauthToken = async (db: Firestore, user: User, name: 'twitch' | 'youtube'): Promise<string | undefined> => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  const data = docRef.data()
  if (data) {
    return data[`${name}-access-token`]
  }
}

export const setOauthToken = async (db: Firestore, user: User, name: 'twitch' | 'youtube') => {
  const params = new URLSearchParams(location.hash.slice(1))
  const token = params.get('access_token')
  if (token) {
    await setDoc(doc(collection(db, 'users'), user.uid), {
      [`${name}-access-token`]: token
    }, { merge: true })
    return true
  } else {
    return false
  }
}
