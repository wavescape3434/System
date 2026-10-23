import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";
import type { Character } from "./domain";
import { validateCharacter } from "./storage";
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const googleConfigured =
  Object.values(config).every(Boolean) &&
  (!Capacitor.isNativePlatform() ||
    !!import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID);
const app = googleConfigured ? getApps()[0] || initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export async function loginGoogle() {
  if (!auth)
    throw new Error(
      "Google linking needs a Firebase project and OAuth client. You can use your local character now. See README for the one-time setup.",
    );
  if (Capacitor.isNativePlatform()) {
    await SocialLogin.initialize({
      google: {
        webClientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID,
        mode: "online",
      },
    });
    const login = await SocialLogin.login({
      provider: "google",
      options: { scopes: ["email", "profile"] },
    });
    if (!("idToken" in login.result) || !login.result.idToken)
      throw new Error(
        "Google did not return an identity token. Please try again.",
      );
    return signInWithCredential(
      auth,
      GoogleAuthProvider.credential(login.result.idToken),
    );
  }
  return signInWithPopup(auth, new GoogleAuthProvider());
}
export async function logoutGoogle() {
  if (Capacitor.isNativePlatform())
    await SocialLogin.logout({ provider: "google" });
  if (auth) await signOut(auth);
}
export async function uploadCharacter(c: Character) {
  if (!app || !auth?.currentUser)
    throw new Error("Link your Google account first.");
  const { getFirestore, doc, setDoc, serverTimestamp } =
    await import("firebase/firestore");
  await setDoc(doc(getFirestore(app), "characters", auth.currentUser.uid), {
    character: c,
    updatedAt: serverTimestamp(),
  });
}
export async function downloadCharacter(): Promise<Character> {
  if (!app || !auth?.currentUser)
    throw new Error("Link your Google account first.");
  const { getFirestore, doc, getDoc } = await import("firebase/firestore");
  const result = await getDoc(
    doc(getFirestore(app), "characters", auth.currentUser.uid),
  );
  if (!result.exists())
    throw new Error(
      "No cloud character yet. Upload this character to save it to your account.",
    );
  const c: unknown = result.data().character;
  if (!validateCharacter(c))
    throw new Error(
      "The cloud character format is invalid. Your local character is unchanged.",
    );
  return c;
}
