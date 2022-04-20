import type {
  CollectionReference,
  Firestore,
  FirestoreDataConverter,
} from "firebase/firestore";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";

import type { User } from "firebase/auth";

export const VOICE_KEYS = ["voice-en", "voice-ja", "voice-und"] as const;
export type VoiceKeys = typeof VOICE_KEYS[number];

export interface UserData {
  readonly nonce?: string;
  readonly "twitch-access-token"?: string;
  readonly "youtube-access-token"?: string;
  readonly "youtube-refresh-token"?: string;
  readonly token?: string | null;

  readonly "voice-en"?: string;
  readonly "voice-ja"?: string;
  readonly "voice-und"?: string;
}

export const extractUserData = (data: any): UserData => {
  let result: UserData = {};
  if (typeof data.nonce !== "undefined")
    result = { ...result, nonce: data.nonce };
  if (typeof data["twitch-access-token"] !== "undefined")
    result = { ...result, "twitch-access-token": data["twitch-access-token"] };
  if (typeof data["youtube-access-token"] !== "undefined")
    result = {
      ...result,
      "youtube-access-token": data["youtube-access-token"],
    };
  if (typeof data["youtube-refresh-token"] !== "undefined")
    result = {
      ...result,
      "youtube-refresh-token": data["youtube-refresh-token"],
    };
  if (typeof data.token !== "undefined")
    result = { ...result, token: data.token };

  for (const key of VOICE_KEYS) {
    if (typeof data[key] !== "undefined")
      result = { ...result, [key]: data[key] };
  }
  return result;
};

export const userConverter: FirestoreDataConverter<UserData> = {
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    return extractUserData(data);
  },
  toFirestore: extractUserData,
};

export const getUsersCollection = (
  db: Firestore
): CollectionReference<UserData> =>
  collection(db, "users").withConverter(userConverter);

export const getUserData = async (
  db: Firestore,
  user: User
): Promise<UserData> => {
  const docRef = await getDoc(doc(getUsersCollection(db), user.uid));
  return docRef.data() || {};
};

export const setUserData = async (
  db: Firestore,
  user: User,
  data: UserData
) => {
  await setDoc(doc(getUsersCollection(db), user.uid), data, { merge: true });
};
