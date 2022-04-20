import type { AppContext } from "../../constants";
import type { Auth } from "firebase/auth";
import { signInWithCustomToken } from "firebase/auth";

interface AuthenticateWithTokenOptions {
  readonly token: string;
  readonly uid: string;
}

export const authenticateWithToken = async (
  auth: Auth,
  { authenticateWithTokenEndpoint }: AppContext,
  { token, uid }: AuthenticateWithTokenOptions
) => {
  const query = new URLSearchParams({ token, uid });
  const response = await fetch(`${authenticateWithTokenEndpoint}?${query}`);
  if (!response.ok) throw new Error("Authentication failed");
  const customToken = await response.text();
  const credential = await signInWithCustomToken(auth, customToken);
  return credential;
};
