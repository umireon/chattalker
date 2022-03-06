import { collection, doc, getDoc } from 'firebase/firestore'

import type { Firestore } from 'firebase/firestore'
import type { User } from 'firebase/auth'

export const getUserData = async (db: Firestore, user: User) => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  return docRef.data()
}
