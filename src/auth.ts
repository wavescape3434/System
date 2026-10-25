import type { FirebaseApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import type { Character } from "./domain";
import { validateCharacter } from "./storage";
import {
  packCloudSnapshot,
  unpackCloudSnapshot,
  validCloudSnapshot,
} from "./cloud-backup";
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
let app: FirebaseApp | null = null;
let authPromise: Promise<Auth | null> | null = null;
async function guildAuth() {
  if (!googleConfigured) return null;
  if (!authPromise)
    authPromise = (async () => {
      const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
      ]);
      app = getApps()[0] || initializeApp(config);
      return getAuth(app);
    })().catch((error) => {
      authPromise = null;
      throw error;
    });
  return authPromise;
}
export function watchGoogleAccount(
  onChange: (user: User | null) => void,
  onError: () => void,
) {
  let disposed = false,
    unsubscribe = () => {};
  if (googleConfigured)
    void guildAuth()
      .then(async (auth) => {
        if (!auth || disposed) return;
        const { onAuthStateChanged } = await import("firebase/auth");
        if (disposed) return;
        unsubscribe = onAuthStateChanged(auth, onChange, onError);
      })
      .catch(() => {
        if (!disposed) onError();
      });
  return () => {
    disposed = true;
    unsubscribe();
  };
}
export async function loginGoogle() {
  const auth = await guildAuth();
  if (!auth)
    throw new Error(
      "Google linking needs a Firebase project and OAuth client. You can use your local character now. See README for the one-time setup.",
    );
  const { GoogleAuthProvider, signInWithPopup, signInWithCredential } =
    await import("firebase/auth");
  if (Capacitor.isNativePlatform()) {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
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
  const auth = await guildAuth();
  if (Capacitor.isNativePlatform()) {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.logout({ provider: "google" });
  }
  if (auth) {
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  }
}
export async function uploadCharacter(c: Character) {
  const auth = await guildAuth();
  if (!app || !auth?.currentUser)
    throw new Error("Link your Google account first.");
  const { getFirestore, doc, setDoc, writeBatch, serverTimestamp } =
    await import("firebase/firestore");
  const db = getFirestore(app),
    uid = auth.currentUser.uid;
  const { manifest, chunks } = await packCloudSnapshot(c);
  // Publish the pointer only after every immutable chunk has committed.
  for (let offset = 0; offset < chunks.length; offset += 40) {
    const batch = writeBatch(db);
    chunks
      .slice(offset, offset + 40)
      .forEach((data, i) =>
        batch.set(
          doc(
            db,
            "characters",
            uid,
            "snapshots",
            manifest.generation,
            "chunks",
            String(offset + i),
          ),
          { data },
        ),
      );
    await batch.commit();
  }
  await setDoc(doc(db, "characters", uid), {
    snapshot: manifest,
    updatedAt: serverTimestamp(),
  });
}
export async function downloadCharacter(): Promise<Character> {
  const auth = await guildAuth();
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
  const saved = result.data();
  let c: unknown = saved.character; // Earlier whole-document backups remain readable.
  if (saved.snapshot !== undefined) {
    if (!validCloudSnapshot(saved.snapshot))
      throw new Error(
        "The cloud backup manifest is invalid. Your local character is unchanged.",
      );
    const snapshot = saved.snapshot,
      db = getFirestore(app),
      uid = auth.currentUser.uid;
    const chunks: unknown[] = [];
    for (let offset = 0; offset < snapshot.chunks; offset += 20) {
      const records = await Promise.all(
        Array.from({ length: Math.min(20, snapshot.chunks - offset) }, (_, i) =>
          getDoc(
            doc(
              db,
              "characters",
              uid,
              "snapshots",
              snapshot.generation,
              "chunks",
              String(offset + i),
            ),
          ),
        ),
      );
      chunks.push(...records.map((r) => (r.exists() ? r.data().data : null)));
    }
    c = await unpackCloudSnapshot(snapshot, chunks);
  }
  if (!validateCharacter(c))
    throw new Error(
      "The cloud character format is invalid. Your local character is unchanged.",
    );
  return c;
}
