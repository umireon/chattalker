import { Firestore, collection, doc, getDoc } from 'firebase/firestore'

import { User } from 'firebase/auth'

export const getUserData = async (db: Firestore, user: User) => {
  const docRef = await getDoc(doc(collection(db, 'users'), user.uid))
  return docRef.data()
}
