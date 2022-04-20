import type { Auth, User } from "firebase/auth";
import { VOICE_KEYS, fetchAudio } from "./audio";
import { collection, doc, setDoc } from "firebase/firestore";

import type { AppContext } from "../../constants";
import type { Firestore } from "firebase/firestore";
import type { Voice } from "./audio";

export interface PlayerElements {
  readonly audioElement: HTMLAudioElement;
  readonly languageElement: Element;
  readonly loadingElement: Element;
  readonly textElement: Element;
  readonly voiceFormElement: HTMLFormElement;
}

export const showLoadingElement = ({ loadingElement }: PlayerElements) => {
  loadingElement.classList.remove("hidden");
};

export const hideLoadingElement = ({ loadingElement }: PlayerElements) => {
  loadingElement.classList.add("hidden");
};

export const readVoiceFromPlayer = ({ voiceFormElement }: PlayerElements) => {
  let voice: Voice = {};
  const formData = new FormData(voiceFormElement);
  for (const key of VOICE_KEYS) {
    const value = formData.get(key);
    if (value !== null) {
      voice = { ...voice, [key]: value };
    }
  }
  return voice;
};

export const playAudio = ({ audioElement }: PlayerElements, blob: Blob) => {
  audioElement.src = URL.createObjectURL(blob);
  audioElement.play();
};

export const showLanguage = (
  { languageElement }: PlayerElements,
  language: string
) => {
  languageElement.textContent = language;
};

export const showText = ({ textElement }: PlayerElements, text: string) => {
  textElement.textContent = text;
};

export const listenLogout = (auth: Auth, element: Element) => {
  element.addEventListener("click", async () => {
    await auth.signOut();
    location.href = "/";
  });
};

export const listenPlay = (
  context: AppContext,
  user: User,
  playerElements: PlayerElements,
  element: HTMLButtonElement
) => {
  const { audioElement, loadingElement } = playerElements;
  element.addEventListener("click", async () => {
    audioElement.play();
    setTimeout(() => {
      audioElement.pause();
    }, 1);
    element.disabled = true;
    loadingElement.classList.remove("hidden");
    const form = document.querySelector("form");
    const voice = form === null ? {} : readVoiceFromPlayer(playerElements);
    const { audioContent, language } = await fetchAudio(
      context,
      user,
      voice,
      element.value
    );
    element.disabled = false;
    loadingElement.classList.add("hidden");
    playAudio(playerElements, audioContent);
    showLanguage(playerElements, language);
    showText(playerElements, element.value);
  });
};

export const listenVoiceChange = (
  db: Firestore,
  user: User,
  element: HTMLSelectElement
) => {
  element.addEventListener("change", () =>
    setDoc(
      doc(collection(db, "users"), user.uid),
      { [element.id]: element.value },
      { merge: true }
    )
  );
};
