import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  linkWithCredential,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDUm2HjqeRufuyFS9SbvDCXJhQycDUPnjI",
  authDomain: "club-del-parque-68530.firebaseapp.com",
  databaseURL: "https://club-del-parque-68530-default-rtdb.firebaseio.com",
  projectId: "club-del-parque-68530",
  storageBucket: "club-del-parque-68530.firebasestorage.app",
  messagingSenderId: "1014072531120",
  appId: "1:1014072531120:web:0feab3ffb7b85876ef0375",
  measurementId: "G-Q8TJD5C0ZM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9099");
export const loginAndSendToBackend = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  const idToken = await user.getIdToken();

  const response = await fetch("api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Login failed");
  }
  return await response.json();
}

export const googleProvider = new GoogleAuthProvider();

/**
 * Intenta login con Google. Puede devolver:
 * - { ok: true, idToken } en caso de éxito completo
 * - { accountExists: true, email, pendingCred } si existe cuenta con otro proveedor
 * - lanza error en otro caso
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in result:", result);
    const idToken = await result.user.getIdToken();
    return { ok: true, idToken, user: result.user };
  } catch (error) {
    // Caso: email ya existe pero con otro proveedor (p.ej. password)
    if (error.code === "auth/account-exists-with-different-credential") {
      const email = error.customData?.email || null;
      const pendingCred = GoogleAuthProvider.credentialFromError(error);
      return { accountExists: true, email, pendingCred };
    }
    // Otros errores
    throw error;
  }
}

/**
 * Helper que vincula la credencial pendiente (Google) a la cuenta actual del usuario
 * - currentUser: usuario ya autenticado (con password)
 * - pendingCred: credential retornado por GoogleProvider.credentialFromError
 */
export async function linkGoogleToExistingAccount(currentUser, pendingCred) {
  // linkWithCredential hace que el proveedor se añada al usuario
  const linked = await linkWithCredential(currentUser, pendingCred);
  // linked.user ahora tiene el provider agregado
  return linked;
}